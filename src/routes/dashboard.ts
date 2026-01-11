import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

const dashboard = new Hono<{ Bindings: Bindings }>()

// 대시보드 통계
dashboard.get('/stats', async (c) => {
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

export default dashboard
