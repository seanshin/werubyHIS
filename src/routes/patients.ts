import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

const patients = new Hono<{ Bindings: Bindings }>()

// 환자 목록 조회
patients.get('/', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM patients 
    ORDER BY created_at DESC 
    LIMIT 100
  `).all()
  
  return c.json({ success: true, data: results })
})

// 환자 상세 조회
patients.get('/:id', async (c) => {
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
patients.post('/', async (c) => {
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

export default patients
