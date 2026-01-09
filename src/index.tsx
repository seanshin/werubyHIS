import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// 환자 관리 API
// ============================================

// 환자 목록 조회
app.get('/api/patients', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM patients 
    ORDER BY created_at DESC 
    LIMIT 100
  `).all()
  
  return c.json({ success: true, data: results })
})

// 환자 상세 조회
app.get('/api/patients/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const patient = await DB.prepare(`
    SELECT * FROM patients WHERE id = ?
  `).bind(id).first()
  
  if (!patient) {
    return c.json({ success: false, error: '환자를 찾을 수 없습니다' }, 404)
  }
  
  return c.json({ success: true, data: patient })
})

// 환자 등록
app.post('/api/patients', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO patients (patient_number, name, birth_date, gender, insurance_type, insurance_number, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.patient_number,
    body.name,
    body.birth_date,
    body.gender,
    body.insurance_type,
    body.insurance_number,
    body.phone,
    body.address
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// ============================================
// 명세서 관리 API
// ============================================

// 명세서 목록 조회
app.get('/api/claims', async (c) => {
  const { DB } = c.env
  const status = c.req.query('status')
  
  let query = `
    SELECT c.*, p.name as patient_name, p.patient_number
    FROM claims c
    LEFT JOIN patients p ON c.patient_id = p.id
  `
  
  if (status) {
    query += ` WHERE c.status = ?`
  }
  
  query += ` ORDER BY c.created_at DESC LIMIT 100`
  
  const stmt = status ? DB.prepare(query).bind(status) : DB.prepare(query)
  const { results } = await stmt.all()
  
  return c.json({ success: true, data: results })
})

// 명세서 상세 조회 (진료 항목 포함)
app.get('/api/claims/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  // 명세서 기본 정보
  const claim = await DB.prepare(`
    SELECT c.*, p.name as patient_name, p.patient_number, p.birth_date, p.gender, p.insurance_type
    FROM claims c
    LEFT JOIN patients p ON c.patient_id = p.id
    WHERE c.id = ?
  `).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 진료 항목
  const { results: items } = await DB.prepare(`
    SELECT * FROM claim_items WHERE claim_id = ? ORDER BY created_at
  `).bind(id).all()
  
  return c.json({ success: true, data: { ...claim, items } })
})

// 명세서 생성
app.post('/api/claims', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  // 명세서 번호 자동 생성
  const claim_number = `C${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`
  
  const result = await DB.prepare(`
    INSERT INTO claims (claim_number, patient_id, visit_date, department, diagnosis_code, diagnosis_name, doctor_name, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    claim_number,
    body.patient_id,
    body.visit_date,
    body.department,
    body.diagnosis_code,
    body.diagnosis_name,
    body.doctor_name,
    '작성중',
    body.notes || ''
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id, claim_number })
})

// 명세서 수정
app.put('/api/claims/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await DB.prepare(`
    UPDATE claims 
    SET visit_date = ?, department = ?, diagnosis_code = ?, diagnosis_name = ?, 
        doctor_name = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.visit_date,
    body.department,
    body.diagnosis_code,
    body.diagnosis_name,
    body.doctor_name,
    body.status,
    body.notes || '',
    id
  ).run()
  
  return c.json({ success: true })
})

// 명세서 삭제
app.delete('/api/claims/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`DELETE FROM claims WHERE id = ?`).bind(id).run()
  
  return c.json({ success: true })
})

// ============================================
// 진료 항목 API
// ============================================

// 진료 항목 추가
app.post('/api/claims/:id/items', async (c) => {
  const { DB } = c.env
  const claim_id = c.req.param('id')
  const body = await c.req.json()
  
  const total_price = body.unit_price * (body.quantity || 1)
  
  const result = await DB.prepare(`
    INSERT INTO claim_items (claim_id, item_code, item_name, item_type, unit_price, quantity, total_price, insurance_coverage, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    claim_id,
    body.item_code,
    body.item_name,
    body.item_type,
    body.unit_price,
    body.quantity || 1,
    total_price,
    body.insurance_coverage || 70,
    body.notes || ''
  ).run()
  
  // 명세서 금액 재계산
  await recalculateClaimAmount(DB, claim_id)
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 진료 항목 삭제
app.delete('/api/claims/:claim_id/items/:item_id', async (c) => {
  const { DB } = c.env
  const claim_id = c.req.param('claim_id')
  const item_id = c.req.param('item_id')
  
  await DB.prepare(`DELETE FROM claim_items WHERE id = ?`).bind(item_id).run()
  
  // 명세서 금액 재계산
  await recalculateClaimAmount(DB, claim_id)
  
  return c.json({ success: true })
})

// 명세서 금액 재계산 함수
async function recalculateClaimAmount(DB: D1Database, claim_id: string) {
  const { results: items } = await DB.prepare(`
    SELECT total_price, insurance_coverage FROM claim_items WHERE claim_id = ?
  `).bind(claim_id).all()
  
  let total_amount = 0
  let insurance_amount = 0
  
  for (const item of items as any[]) {
    total_amount += item.total_price
    insurance_amount += Math.floor(item.total_price * item.insurance_coverage / 100)
  }
  
  const copay_amount = total_amount - insurance_amount
  
  await DB.prepare(`
    UPDATE claims 
    SET total_amount = ?, insurance_amount = ?, copay_amount = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(total_amount, insurance_amount, copay_amount, claim_id).run()
}

// ============================================
// 사전점검 API
// ============================================

// 사전점검 실행
app.post('/api/claims/:id/precheck', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  // 시뮬레이션: 사전점검 로직
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  const errors: string[] = []
  const warnings: string[] = []
  
  // 간단한 검증 로직
  if (!claim.total_amount || claim.total_amount === 0) {
    errors.push('진료 항목이 없습니다')
  }
  
  if (!claim.diagnosis_code) {
    errors.push('진단코드가 없습니다')
  }
  
  if (claim.total_amount > 1000000) {
    warnings.push('진료비가 100만원을 초과합니다')
  }
  
  // 상태 업데이트
  if (errors.length === 0) {
    await DB.prepare(`
      UPDATE claims SET status = '사전점검완료', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run()
  }
  
  return c.json({
    success: true,
    passed: errors.length === 0,
    errors,
    warnings
  })
})

// ============================================
// 청구 제출 API
// ============================================

// 청구 제출
app.post('/api/claims/:id/submit', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 제출 번호 생성
  const submission_number = `S${claim.claim_number}-${Date.now().toString().slice(-4)}`
  
  // 청구 제출 이력 생성
  const result = await DB.prepare(`
    INSERT INTO claim_submissions (claim_id, submission_number, submission_type, submission_date, status, response_data)
    VALUES (?, ?, '신규', CURRENT_TIMESTAMP, '접수완료', ?)
  `).bind(
    id,
    submission_number,
    JSON.stringify({
      message: '정상 접수되었습니다',
      receipt_number: `R${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`
    })
  ).run()
  
  // 명세서 상태 업데이트
  await DB.prepare(`
    UPDATE claims 
    SET status = '청구완료', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run()
  
  return c.json({
    success: true,
    submission_number,
    message: '청구가 정상적으로 제출되었습니다'
  })
})

// 청구 이력 조회
app.get('/api/claims/:id/submissions', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const { results } = await DB.prepare(`
    SELECT * FROM claim_submissions WHERE claim_id = ? ORDER BY submission_date DESC
  `).bind(id).all()
  
  return c.json({ success: true, data: results })
})

// ============================================
// 외부기관 연계 API
// ============================================

// 자격조회
app.post('/api/integrations/eligibility', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  // 시뮬레이션: 자격조회 결과
  const response_data = {
    valid: true,
    insurance_type: '건강보험',
    status: '정상',
    coverage_start: '2020-01-01',
    special_exemption: false
  }
  
  // 이력 저장
  await DB.prepare(`
    INSERT INTO external_integrations (integration_type, patient_id, request_data, response_data, status, requested_at, responded_at)
    VALUES ('자격조회', ?, ?, ?, '성공', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    body.patient_id,
    JSON.stringify(body),
    JSON.stringify(response_data)
  ).run()
  
  return c.json({ success: true, data: response_data })
})

// 산정특례 승인
app.post('/api/integrations/special-approval', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  // 시뮬레이션: 산정특례 승인 결과
  const response_data = {
    approved: Math.random() > 0.3, // 70% 승인율
    coverage_rate: 90,
    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    approval_number: `SA${Date.now().toString().slice(-8)}`
  }
  
  await DB.prepare(`
    INSERT INTO external_integrations (integration_type, patient_id, request_data, response_data, status, requested_at, responded_at)
    VALUES ('산정특례승인', ?, ?, ?, '성공', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    body.patient_id,
    JSON.stringify(body),
    JSON.stringify(response_data)
  ).run()
  
  return c.json({ success: true, data: response_data })
})

// 실손보험 연계
app.post('/api/integrations/private-insurance', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  // 시뮬레이션: 실손보험 연계 결과
  const companies = ['삼성화재', '현대해상', 'KB손해보험', '메리츠화재']
  const response_data = {
    insurance_company: companies[Math.floor(Math.random() * companies.length)],
    claim_number: `INS-${Date.now().toString().slice(-8)}`,
    status: '접수',
    expected_payment: Math.floor(body.amount * 0.8)
  }
  
  await DB.prepare(`
    INSERT INTO external_integrations (integration_type, patient_id, request_data, response_data, status, requested_at, responded_at)
    VALUES ('실손보험연계', ?, ?, ?, '성공', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    body.patient_id,
    JSON.stringify(body),
    JSON.stringify(response_data)
  ).run()
  
  return c.json({ success: true, data: response_data })
})

// 연계 이력 조회
app.get('/api/integrations', async (c) => {
  const { DB } = c.env
  const type = c.req.query('type')
  const patient_id = c.req.query('patient_id')
  
  let query = `SELECT * FROM external_integrations WHERE 1=1`
  const params: any[] = []
  
  if (type) {
    query += ` AND integration_type = ?`
    params.push(type)
  }
  
  if (patient_id) {
    query += ` AND patient_id = ?`
    params.push(patient_id)
  }
  
  query += ` ORDER BY requested_at DESC LIMIT 100`
  
  const { results } = await DB.prepare(query).bind(...params).all()
  
  return c.json({ success: true, data: results })
})

// ============================================
// 심사 결과 관리 API
// ============================================

// 심사 결과 시뮬레이션 생성
app.post('/api/claims/:id/review-result', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 시뮬레이션: 심사 결과 생성
  const result_types = ['적정', '적정', '적정', '부분삭감', '전체삭감', '보류']
  const result_type = result_types[Math.floor(Math.random() * result_types.length)]
  
  let approved_amount = claim.total_amount
  let reduction_amount = 0
  let reduction_reason = null
  
  if (result_type === '부분삭감') {
    reduction_amount = Math.floor(claim.total_amount * (Math.random() * 0.2 + 0.05)) // 5-25% 삭감
    approved_amount = claim.total_amount - reduction_amount
    reduction_reason = '일부 진료 항목이 급여 인정 기준에 미달'
  } else if (result_type === '전체삭감') {
    approved_amount = 0
    reduction_amount = claim.total_amount
    reduction_reason = '진료 내용이 급여 기준에 부적합'
  }
  
  const payment_amount = Math.floor(approved_amount * 0.7) // 보험자 부담금 (70%)
  
  const result = await DB.prepare(`
    INSERT INTO review_results (claim_id, result_type, original_amount, approved_amount, reduction_amount, reduction_reason, review_date, payment_date, payment_amount)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, date('now', '+7 days'), ?)
  `).bind(
    id,
    result_type,
    claim.total_amount,
    approved_amount,
    reduction_amount,
    reduction_reason,
    payment_amount
  ).run()
  
  // 명세서 상태 업데이트
  await DB.prepare(`
    UPDATE claims 
    SET status = '심사완료', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run()
  
  return c.json({
    success: true,
    data: {
      result_type,
      original_amount: claim.total_amount,
      approved_amount,
      reduction_amount,
      payment_amount
    }
  })
})

// 심사 결과 조회
app.get('/api/claims/:id/review-result', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const result = await DB.prepare(`
    SELECT * FROM review_results WHERE claim_id = ? ORDER BY created_at DESC LIMIT 1
  `).bind(id).first()
  
  if (!result) {
    return c.json({ success: false, error: '심사 결과가 없습니다' }, 404)
  }
  
  return c.json({ success: true, data: result })
})

// ============================================
// 입금 관리 API
// ============================================

// 입금 내역 조회
app.get('/api/payments', async (c) => {
  const { DB } = c.env
  const status = c.req.query('status')
  
  let query = `
    SELECT p.*, c.claim_number, pt.name as patient_name
    FROM payments p
    LEFT JOIN claims c ON p.claim_id = c.id
    LEFT JOIN patients pt ON c.patient_id = pt.id
  `
  
  if (status) {
    query += ` WHERE p.status = ?`
  }
  
  query += ` ORDER BY p.payment_date DESC LIMIT 100`
  
  const stmt = status ? DB.prepare(query).bind(status) : DB.prepare(query)
  const { results } = await stmt.all()
  
  return c.json({ success: true, data: results })
})

// 입금 확인
app.post('/api/payments/:id/confirm', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`
    UPDATE payments SET status = '입금완료' WHERE id = ?
  `).bind(id).run()
  
  return c.json({ success: true })
})

// ============================================
// 대시보드 통계 API
// ============================================

app.get('/api/dashboard/stats', async (c) => {
  const { DB } = c.env
  
  // 전체 환자 수
  const patients = await DB.prepare(`SELECT COUNT(*) as count FROM patients`).first()
  
  // 명세서 상태별 통계
  const claims = await DB.prepare(`
    SELECT status, COUNT(*) as count FROM claims GROUP BY status
  `).all()
  
  // 이번 달 청구 금액
  const this_month = await DB.prepare(`
    SELECT SUM(total_amount) as total FROM claims 
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).first()
  
  // 입금 대기
  const pending_payments = await DB.prepare(`
    SELECT COUNT(*) as count, SUM(payment_amount) as amount FROM payments 
    WHERE status = '입금대기'
  `).first()
  
  return c.json({
    success: true,
    data: {
      total_patients: patients?.count || 0,
      claims_by_status: claims.results || [],
      this_month_claims: this_month?.total || 0,
      pending_payments: {
        count: pending_payments?.count || 0,
        amount: pending_payments?.amount || 0
      }
    }
  })
})

// ============================================
// 메인 페이지
// ============================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>의료 청구/연계 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="mt-4 text-gray-600">로딩 중...</p>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
