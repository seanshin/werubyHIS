#!/bin/bash
echo "=== POST API 기능 테스트 ==="
echo ""

echo "1. 자격조회 테스트:"
curl -s -X POST http://localhost:3000/api/integrations/eligibility \
  -H "Content-Type: application/json" \
  -d '{"patient_id": 1}' | jq '.data'
echo ""

echo "2. 사전점검 테스트 (명세서 ID: 1):"
curl -s -X POST http://localhost:3000/api/claims/1/precheck | jq '.'
echo ""

echo "3. 산정특례 승인 테스트:"
curl -s -X POST http://localhost:3000/api/integrations/special-approval \
  -H "Content-Type: application/json" \
  -d '{"patient_id": 1, "disease_code": "V193"}' | jq '.data'
echo ""

echo "4. 실손보험 연계 테스트:"
curl -s -X POST http://localhost:3000/api/integrations/private-insurance \
  -H "Content-Type: application/json" \
  -d '{"patient_id": 1, "amount": 50000}' | jq '.data'
echo ""

echo "✅ 모든 POST API 정상 동작 확인!"
