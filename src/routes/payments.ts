import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

const payments = new Hono<{ Bindings: Bindings }>()

// 입금 내역 조회
payments.get('/', async (c) => {
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
payments.post('/:id/confirm', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`
    UPDATE payments SET status = '입금완료' WHERE id = ?
  `).bind(id).run()
  
  return c.json({ success: true })
})

export default payments
