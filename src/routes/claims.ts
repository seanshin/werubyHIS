import { Hono } from 'hono'
import { recalculateClaimAmount, generateClaimNumber, generateSubmissionNumber } from '../utils/claimUtils'
import type { Bindings } from '../types/bindings'

const claims = new Hono<{ Bindings: Bindings }>()

// 명세서 목록 조회
claims.get('/', async (c) => {
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
claims.get('/:id', async (c) => {
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
claims.post('/', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  // 명세서 번호 자동 생성
  const claim_number = generateClaimNumber()
  
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
claims.put('/:id', async (c) => {
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
claims.delete('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`DELETE FROM claims WHERE id = ?`).bind(id).run()
  
  return c.json({ success: true })
})

// 진료 항목 추가
claims.post('/:id/items', async (c) => {
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
claims.delete('/:claim_id/items/:item_id', async (c) => {
  const { DB } = c.env
  const claim_id = c.req.param('claim_id')
  const item_id = c.req.param('item_id')
  
  await DB.prepare(`DELETE FROM claim_items WHERE id = ?`).bind(item_id).run()
  
  // 명세서 금액 재계산
  await recalculateClaimAmount(DB, claim_id)
  
  return c.json({ success: true })
})

// 사전점검 실행
claims.post('/:id/precheck', async (c) => {
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

// 청구 제출
claims.post('/:id/submit', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 제출 번호 생성
  const submission_number = generateSubmissionNumber(claim.claim_number as string)
  
  // 청구 제출 이력 생성
  await DB.prepare(`
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
claims.get('/:id/submissions', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const { results } = await DB.prepare(`
    SELECT * FROM claim_submissions WHERE claim_id = ? ORDER BY submission_date DESC
  `).bind(id).all()
  
  return c.json({ success: true, data: results })
})

// 심사 결과 시뮬레이션 생성
claims.post('/:id/review-result', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 시뮬레이션: 심사 결과 생성
  const result_types = ['적정', '적정', '적정', '부분삭감', '전체삭감', '보류']
  const result_type = result_types[Math.floor(Math.random() * result_types.length)]
  
  let approved_amount = claim.total_amount as number
  let reduction_amount = 0
  let reduction_reason = null
  
  if (result_type === '부분삭감') {
    reduction_amount = Math.floor(approved_amount * (Math.random() * 0.2 + 0.05)) // 5-25% 삭감
    approved_amount = approved_amount - reduction_amount
    reduction_reason = '일부 진료 항목이 급여 인정 기준에 미달'
  } else if (result_type === '전체삭감') {
    approved_amount = 0
    reduction_amount = approved_amount
    reduction_reason = '진료 내용이 급여 기준에 부적합'
  }
  
  const payment_amount = Math.floor(approved_amount * 0.7) // 보험자 부담금 (70%)
  
  await DB.prepare(`
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
claims.get('/:id/review-result', async (c) => {
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

// 보완 청구
claims.post('/:id/supplement', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 보완 청구 번호 생성
  const submission_number = generateSubmissionNumber(claim.claim_number as string)
  
  // 보완 청구 이력 생성
  await DB.prepare(`
    INSERT INTO claim_submissions (claim_id, submission_number, submission_type, submission_date, status, response_data)
    VALUES (?, ?, '보완', CURRENT_TIMESTAMP, '접수완료', ?)
  `).bind(
    id,
    submission_number,
    JSON.stringify({
      message: '보완 청구가 정상 접수되었습니다',
      supplement_reason: body.reason || '보완 요청 사항 반영'
    })
  ).run()
  
  // 명세서 상태 업데이트
  await DB.prepare(`
    UPDATE claims 
    SET status = '보완청구', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run()
  
  return c.json({
    success: true,
    submission_number,
    message: '보완 청구가 정상적으로 제출되었습니다'
  })
})

// 추가 청구
claims.post('/:id/additional', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 추가 청구 번호 생성
  const submission_number = generateSubmissionNumber(claim.claim_number as string)
  
  // 추가 청구 이력 생성
  await DB.prepare(`
    INSERT INTO claim_submissions (claim_id, submission_number, submission_type, submission_date, status, response_data)
    VALUES (?, ?, '추가', CURRENT_TIMESTAMP, '접수완료', ?)
  `).bind(
    id,
    submission_number,
    JSON.stringify({
      message: '추가 청구가 정상 접수되었습니다',
      additional_amount: body.additional_amount || 0
    })
  ).run()
  
  // 명세서 상태 업데이트
  await DB.prepare(`
    UPDATE claims 
    SET status = '추가청구', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run()
  
  return c.json({
    success: true,
    submission_number,
    message: '추가 청구가 정상적으로 제출되었습니다'
  })
})

// 청구 취소
claims.post('/:id/cancel', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(id).first()
  
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  // 청구 취소 이력 생성
  const submission_number = generateSubmissionNumber(claim.claim_number as string)
  
  await DB.prepare(`
    INSERT INTO claim_submissions (claim_id, submission_number, submission_type, submission_date, status, response_data)
    VALUES (?, ?, '취소', CURRENT_TIMESTAMP, '취소완료', ?)
  `).bind(
    id,
    submission_number,
    JSON.stringify({
      message: '청구가 취소되었습니다',
      cancel_reason: body.reason || '사용자 요청'
    })
  ).run()
  
  // 명세서 상태 업데이트
  await DB.prepare(`
    UPDATE claims 
    SET status = '청구취소', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run()
  
  return c.json({
    success: true,
    message: '청구가 취소되었습니다'
  })
})

export default claims
