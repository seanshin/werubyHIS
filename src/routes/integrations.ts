import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

const integrations = new Hono<{ Bindings: Bindings }>()

// 자격조회
integrations.post('/eligibility', async (c) => {
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
integrations.post('/special-approval', async (c) => {
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
integrations.post('/private-insurance', async (c) => {
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
integrations.get('/', async (c) => {
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

export default integrations
