-- 샘플 환자 데이터
INSERT INTO patients (patient_number, name, birth_date, gender, insurance_type, insurance_number, phone, address) VALUES
('P2024001', '김철수', '1980-05-15', 'M', '건강보험', '1234567890', '010-1234-5678', '서울시 강남구 테헤란로 123'),
('P2024002', '이영희', '1975-08-22', 'F', '건강보험', '0987654321', '010-2345-6789', '서울시 서초구 서초대로 456'),
('P2024003', '박민수', '1990-03-10', 'M', '의료급여', '1122334455', '010-3456-7890', '경기도 성남시 분당구 789'),
('P2024004', '최지혜', '1985-11-30', 'F', '건강보험', '5544332211', '010-4567-8901', '서울시 송파구 올림픽로 321'),
('P2024005', '정대호', '1992-07-18', 'M', '건강보험', '6677889900', '010-5678-9012', '인천시 남동구 인하로 654');

-- 샘플 진료 명세서
INSERT INTO claims (claim_number, patient_id, visit_date, department, diagnosis_code, diagnosis_name, doctor_name, status, total_amount, insurance_amount, copay_amount) VALUES
('C202401001', 1, '2024-01-15', '내과', 'J00', '급성 비인두염(감기)', '홍길동', '청구완료', 35000, 24500, 10500),
('C202401002', 2, '2024-01-16', '정형외과', 'M54.5', '요통', '김의사', '심사중', 85000, 59500, 25500),
('C202401003', 3, '2024-01-17', '소아청소년과', 'J06.9', '상기도감염', '이의사', '심사완료', 28000, 25200, 2800),
('C202401004', 1, '2024-01-20', '내과', 'K29.7', '상세불명의 위염', '홍길동', '청구대기', 45000, 31500, 13500),
('C202401005', 4, '2024-01-22', '피부과', 'L70.0', '여드름', '박의사', '작성중', 0, 0, 0);

-- 샘플 진료 항목
INSERT INTO claim_items (claim_id, item_code, item_name, item_type, unit_price, quantity, total_price, insurance_coverage) VALUES
(1, 'AA001', '초진진찰료', '진찰료', 15000, 1, 15000, 70),
(1, 'D0001', '혈액검사', '검사료', 12000, 1, 12000, 70),
(1, 'M0001', '약제처방', '약제비', 8000, 1, 8000, 70),
(2, 'AA002', '재진진찰료', '진찰료', 10000, 1, 10000, 70),
(2, 'E0001', 'X-ray 촬영', '영상진단료', 35000, 1, 35000, 70),
(2, 'G0001', '물리치료', '처치료', 40000, 1, 40000, 70),
(3, 'AA001', '초진진찰료', '진찰료', 15000, 1, 15000, 90),
(3, 'D0002', '소변검사', '검사료', 8000, 1, 8000, 90),
(3, 'M0002', '항생제처방', '약제비', 5000, 1, 5000, 90),
(4, 'AA002', '재진진찰료', '진찰료', 10000, 1, 10000, 70),
(4, 'H0001', '내시경검사', '검사료', 35000, 1, 35000, 70);

-- 샘플 청구 이력
INSERT INTO claim_submissions (claim_id, submission_number, submission_type, submission_date, status, response_data) VALUES
(1, 'S202401001-1', '신규', '2024-01-15 14:30:00', '접수완료', '{"message": "정상 접수되었습니다", "receipt_number": "R20240115001"}'),
(2, 'S202401002-1', '신규', '2024-01-16 16:45:00', '접수완료', '{"message": "정상 접수되었습니다", "receipt_number": "R20240116001"}'),
(3, 'S202401003-1', '신규', '2024-01-17 10:20:00', '접수완료', '{"message": "정상 접수되었습니다", "receipt_number": "R20240117001"}');

-- 샘플 외부기관 연계 이력
INSERT INTO external_integrations (integration_type, patient_id, request_data, response_data, status, requested_at, responded_at) VALUES
('자격조회', 1, '{"patient_number": "P2024001", "insurance_number": "1234567890"}', '{"valid": true, "insurance_type": "건강보험", "status": "정상"}', '성공', '2024-01-15 09:00:00', '2024-01-15 09:00:05'),
('자격조회', 2, '{"patient_number": "P2024002", "insurance_number": "0987654321"}', '{"valid": true, "insurance_type": "건강보험", "status": "정상"}', '성공', '2024-01-16 10:30:00', '2024-01-16 10:30:03'),
('산정특례승인', 3, '{"patient_number": "P2024003", "diagnosis_code": "J06.9"}', '{"approved": true, "coverage_rate": 90, "valid_until": "2024-12-31"}', '성공', '2024-01-17 08:45:00', '2024-01-17 08:45:12'),
('실손보험연계', 1, '{"claim_number": "C202401001", "amount": 35000}', '{"insurance_company": "삼성화재", "claim_number": "INS-001", "status": "접수"}', '성공', '2024-01-15 15:00:00', '2024-01-15 15:00:20');

-- 샘플 심사 결과
INSERT INTO review_results (claim_id, result_type, original_amount, approved_amount, reduction_amount, reduction_reason, review_date, payment_date, payment_amount) VALUES
(1, '적정', 35000, 35000, 0, NULL, '2024-01-20 10:00:00', '2024-01-25 09:00:00', 24500),
(3, '부분삭감', 28000, 25000, 3000, '진료 항목 일부 인정 제외', '2024-01-22 14:30:00', '2024-01-27 09:00:00', 22500);

-- 샘플 입금 관리
INSERT INTO payments (claim_id, payment_date, payment_amount, payment_type, bank_name, account_number, status) VALUES
(1, '2024-01-25', 24500, '보험자부담금', '국민은행', '123-456-789012', '입금완료'),
(1, '2024-01-25', 10500, '본인부담금', '국민은행', '123-456-789012', '입금완료'),
(3, '2024-01-27', 22500, '보험자부담금', '국민은행', '123-456-789012', '입금완료');
