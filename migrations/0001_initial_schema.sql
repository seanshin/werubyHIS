-- 환자 정보 테이블
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('M', 'F')) NOT NULL,
  insurance_type TEXT CHECK(insurance_type IN ('건강보험', '의료급여', '산재보험', '자동차보험')) NOT NULL,
  insurance_number TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 진료 명세서 테이블
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_number TEXT UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL,
  visit_date TEXT NOT NULL,
  department TEXT NOT NULL,
  diagnosis_code TEXT NOT NULL,
  diagnosis_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  status TEXT CHECK(status IN ('작성중', '사전점검완료', '청구대기', '청구완료', '심사중', '심사완료', '보완필요', '지급완료')) DEFAULT '작성중',
  total_amount INTEGER DEFAULT 0,
  insurance_amount INTEGER DEFAULT 0,
  copay_amount INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- 진료 항목 테이블 (명세서 상세)
CREATE TABLE IF NOT EXISTS claim_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT CHECK(item_type IN ('진찰료', '검사료', '영상진단료', '처치료', '수술료', '마취료', '약제비', '치료재료비')) NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price INTEGER NOT NULL,
  insurance_coverage INTEGER DEFAULT 100,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

-- 청구 이력 테이블
CREATE TABLE IF NOT EXISTS claim_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  submission_number TEXT UNIQUE NOT NULL,
  submission_type TEXT CHECK(submission_type IN ('신규', '보완', '추가')) NOT NULL,
  submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK(status IN ('전송대기', '전송완료', '전송실패', '접수완료')) DEFAULT '전송대기',
  response_data TEXT,
  error_message TEXT,
  FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- 외부기관 연계 이력 테이블
CREATE TABLE IF NOT EXISTS external_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_type TEXT CHECK(integration_type IN ('자격조회', '산정특례승인', '급여승인', '실손보험연계', '진료정보교류')) NOT NULL,
  patient_id INTEGER,
  request_data TEXT,
  response_data TEXT,
  status TEXT CHECK(status IN ('요청', '성공', '실패')) NOT NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- 심사 결과 테이블
CREATE TABLE IF NOT EXISTS review_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  result_type TEXT CHECK(result_type IN ('적정', '부분삭감', '전체삭감', '보류')) NOT NULL,
  original_amount INTEGER NOT NULL,
  approved_amount INTEGER NOT NULL,
  reduction_amount INTEGER DEFAULT 0,
  reduction_reason TEXT,
  review_date DATETIME,
  payment_date DATETIME,
  payment_amount INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- 입금 관리 테이블
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  payment_amount INTEGER NOT NULL,
  payment_type TEXT CHECK(payment_type IN ('보험자부담금', '본인부담금', '추가청구')) NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  status TEXT CHECK(status IN ('입금대기', '입금완료', '입금오류')) DEFAULT '입금대기',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_patients_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_insurance ON patients(insurance_number);
CREATE INDEX IF NOT EXISTS idx_claims_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_visit_date ON claims(visit_date);
CREATE INDEX IF NOT EXISTS idx_claim_items_claim ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_submissions_claim ON claim_submissions(claim_id);
CREATE INDEX IF NOT EXISTS idx_integrations_patient ON external_integrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON external_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_review_claim ON review_results(claim_id);
CREATE INDEX IF NOT EXISTS idx_payments_claim ON payments(claim_id);
