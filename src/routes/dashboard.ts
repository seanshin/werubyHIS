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

// 월별 청구 통계
dashboard.get('/monthly-stats', async (c) => {
  const { DB } = c.env
  const months = c.req.query('months') || '6'
  
  const { results } = await DB.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count,
      SUM(total_amount) as total_amount,
      SUM(insurance_amount) as insurance_amount,
      SUM(copay_amount) as copay_amount
    FROM claims
    WHERE created_at >= date('now', '-' || ? || ' months')
    GROUP BY month
    ORDER BY month
  `).bind(months).all()
  
  return c.json({ success: true, data: results })
})

// 삭감율 분석
dashboard.get('/reduction-analysis', async (c) => {
  const { DB } = c.env
  
  const { results } = await DB.prepare(`
    SELECT 
      rr.result_type,
      COUNT(*) as count,
      AVG(rr.reduction_amount * 100.0 / NULLIF(rr.original_amount, 0)) as avg_reduction_rate,
      SUM(rr.original_amount) as total_original,
      SUM(rr.approved_amount) as total_approved,
      SUM(rr.reduction_amount) as total_reduction
    FROM review_results rr
    GROUP BY rr.result_type
  `).all()
  
  return c.json({ success: true, data: results })
})

// 진료과별 통계
dashboard.get('/department-stats', async (c) => {
  const { DB } = c.env
  
  const { results } = await DB.prepare(`
    SELECT 
      department,
      COUNT(*) as count,
      SUM(total_amount) as total_amount,
      AVG(total_amount) as avg_amount
    FROM claims
    WHERE department IS NOT NULL
    GROUP BY department
    ORDER BY total_amount DESC
  `).all()
  
  return c.json({ success: true, data: results })
})

export default dashboard
