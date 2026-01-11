import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

const postManagement = new Hono<{ Bindings: Bindings }>()

// 보완 요청 목록 조회
postManagement.get('/supplement-requests', async (c) => {
  const { DB } = c.env
  const status = c.req.query('status')
  const claim_id = c.req.query('claim_id')
  
  let query = `
    SELECT sr.*, c.claim_number, c.patient_id, p.name as patient_name
    FROM supplement_requests sr
    LEFT JOIN claims c ON sr.claim_id = c.id
    LEFT JOIN patients p ON c.patient_id = p.id
    WHERE 1=1
  `
  const params: any[] = []
  
  if (status) {
    query += ` AND sr.status = ?`
    params.push(status)
  }
  
  if (claim_id) {
    query += ` AND sr.claim_id = ?`
    params.push(claim_id)
  }
  
  query += ` ORDER BY sr.requested_at DESC LIMIT 100`
  
  const { results } = await DB.prepare(query).bind(...params).all()
  
  return c.json({ success: true, data: results })
})

// 보완 요청 상세 조회
postManagement.get('/supplement-requests/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const request = await DB.prepare(`
    SELECT sr.*, c.claim_number, c.patient_id, p.name as patient_name, p.patient_number
    FROM supplement_requests sr
    LEFT JOIN claims c ON sr.claim_id = c.id
    LEFT JOIN patients p ON c.patient_id = p.id
    WHERE sr.id = ?
  `).bind(id).first()
  
  if (!request) {
    return c.json({ success: false, error: '보완 요청을 찾을 수 없습니다' }, 404)
  }
  
  // 이의신청 상세 조회
  const { results: appealDetails } = await DB.prepare(`
    SELECT * FROM appeal_details WHERE supplement_request_id = ?
  `).bind(id).all()
  
  return c.json({ success: true, data: { ...request, appealDetails } })
})

// 보완 요청 생성
postManagement.post('/supplement-requests', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  // 명세서 확인
  const claim = await DB.prepare(`SELECT * FROM claims WHERE id = ?`).bind(body.claim_id).first()
  if (!claim) {
    return c.json({ success: false, error: '명세서를 찾을 수 없습니다' }, 404)
  }
  
  const result = await DB.prepare(`
    INSERT INTO supplement_requests (claim_id, review_result_id, request_type, request_reason, requested_items, status)
    VALUES (?, ?, ?, ?, ?, '요청')
  `).bind(
    body.claim_id,
    body.review_result_id || null,
    body.request_type || '보완요청',
    body.request_reason,
    body.requested_items ? JSON.stringify(body.requested_items) : null
  ).run()
  
  // 이의신청 상세가 있으면 추가
  if (body.appealDetails && body.appealDetails.length > 0) {
    for (const detail of body.appealDetails) {
      await DB.prepare(`
        INSERT INTO appeal_details (supplement_request_id, item_code, item_name, original_amount, requested_amount, appeal_reason, supporting_documents)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        result.meta.last_row_id,
        detail.item_code || null,
        detail.item_name || null,
        detail.original_amount || null,
        detail.requested_amount || null,
        detail.appeal_reason,
        detail.supporting_documents ? JSON.stringify(detail.supporting_documents) : null
      ).run()
    }
  }
  
  // 명세서 상태 업데이트
  await DB.prepare(`
    UPDATE claims SET status = '보완필요', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(body.claim_id).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 보완 요청 처리 (상태 업데이트)
postManagement.put('/supplement-requests/:id/process', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const request = await DB.prepare(`SELECT * FROM supplement_requests WHERE id = ?`).bind(id).first()
  if (!request) {
    return c.json({ success: false, error: '보완 요청을 찾을 수 없습니다' }, 404)
  }
  
  await DB.prepare(`
    UPDATE supplement_requests 
    SET status = ?, response_text = ?, responded_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.status,
    body.response_text || null,
    id
  ).run()
  
  // 명세서 상태 업데이트
  if (body.status === '완료') {
    await DB.prepare(`
      UPDATE claims SET status = '심사중', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(request.claim_id).run()
  }
  
  return c.json({ success: true })
})

// 이의신청 목록 조회 (보완 요청의 일부)
postManagement.get('/appeals', async (c) => {
  const { DB } = c.env
  const status = c.req.query('status')
  
  let query = `
    SELECT sr.*, c.claim_number, c.patient_id, p.name as patient_name
    FROM supplement_requests sr
    LEFT JOIN claims c ON sr.claim_id = c.id
    LEFT JOIN patients p ON c.patient_id = p.id
    WHERE sr.request_type = '이의신청'
  `
  const params: any[] = []
  
  if (status) {
    query += ` AND sr.status = ?`
    params.push(status)
  }
  
  query += ` ORDER BY sr.requested_at DESC LIMIT 100`
  
  const { results } = await DB.prepare(query).bind(...params).all()
  
  return c.json({ success: true, data: results })
})

export default postManagement
