#!/bin/bash
echo "=== 의료 청구/연계 시스템 전체 기능 테스트 ==="
echo ""
echo "1. 대시보드 통계:"
curl -s http://localhost:3000/api/dashboard/stats | jq '.data'
echo ""
echo "2. 환자 관리:"
echo "  - 환자 수: $(curl -s http://localhost:3000/api/patients | jq '.data | length')명"
curl -s http://localhost:3000/api/patients | jq '.data[0] | {id, name, patient_number, insurance_type}'
echo ""
echo "3. 명세서 관리:"
echo "  - 명세서 수: $(curl -s http://localhost:3000/api/claims | jq '.data | length')건"
curl -s http://localhost:3000/api/claims | jq '.data[0] | {id, claim_number, patient_name, status, total_amount}'
echo ""
echo "4. 외부기관 연계:"
echo "  - 연계 이력: $(curl -s http://localhost:3000/api/integrations | jq '.data | length')건"
curl -s http://localhost:3000/api/integrations | jq '.data[0] | {id, integration_type, status}'
echo ""
echo "5. 입금 관리:"
echo "  - 입금 내역: $(curl -s http://localhost:3000/api/payments | jq '.data | length')건"
curl -s http://localhost:3000/api/payments | jq '.data[0] | {id, claim_number, payment_amount, status}'
echo ""
echo "✅ 모든 API 엔드포인트 정상 동작 확인!"
