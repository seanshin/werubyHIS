// 명세서 관련 유틸리티 함수

export async function recalculateClaimAmount(DB: D1Database, claim_id: string) {
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

export function generateClaimNumber(): string {
  return `C${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`
}

export function generateSubmissionNumber(claim_number: string): string {
  return `S${claim_number}-${Date.now().toString().slice(-4)}`
}
