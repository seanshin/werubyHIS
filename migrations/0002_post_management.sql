-- 보완 요청 테이블
CREATE TABLE IF NOT EXISTS supplement_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  review_result_id INTEGER,
  request_type TEXT CHECK(request_type IN ('보완요청', '이의신청')) NOT NULL,
  request_reason TEXT NOT NULL,
  requested_items TEXT, -- JSON 형식으로 보완/이의 항목 저장
  status TEXT CHECK(status IN ('요청', '처리중', '완료', '거부')) DEFAULT '요청',
  response_text TEXT,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id),
  FOREIGN KEY (review_result_id) REFERENCES review_results(id)
);

-- 이의신청 상세 테이블
CREATE TABLE IF NOT EXISTS appeal_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplement_request_id INTEGER NOT NULL,
  item_code TEXT,
  item_name TEXT,
  original_amount INTEGER,
  requested_amount INTEGER,
  appeal_reason TEXT NOT NULL,
  supporting_documents TEXT, -- 문서 목록 (JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplement_request_id) REFERENCES supplement_requests(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_supplement_claim ON supplement_requests(claim_id);
CREATE INDEX IF NOT EXISTS idx_supplement_status ON supplement_requests(status);
CREATE INDEX IF NOT EXISTS idx_appeal_request ON appeal_details(supplement_request_id);
