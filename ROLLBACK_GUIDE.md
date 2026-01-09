# WeRuby HIS - 버전 관리 및 롤백 가이드

## 📅 오늘 작업된 버전 (2026-01-09)

### 버전 타임라인

```
09:57:56 → v1.0-initial (c32c280)
           ├─ 초기 프로젝트 생성
           └─ Hono + Cloudflare Pages 템플릿

10:05:31 → v2.0-complete (4b46dc3) ⭐ 권장 안정 버전
           ├─ 완전한 의료 청구 시스템
           ├─ 5개 메뉴: 대시보드, 환자, 명세서, 연계, 입금
           ├─ 데이터베이스 스키마 완성
           ├─ 30+ API 엔드포인트
           └─ 샘플 데이터 포함

10:31:40 → v2.1-admissions (938577e) ✨ 현재 버전
           ├─ 원무업무 통합 페이지 추가
           ├─ 6개 메뉴 (원무업무 통합 추가)
           ├─ 실시간 통계 대시보드
           └─ 대기환자/수납 관리
```

---

## 📦 백업 파일 목록

| 백업 파일 | 생성 시간 | 크기 | 버전 | 설명 |
|----------|----------|------|------|------|
| `medical_backup.tar.gz` | 10:08:53 | 98KB | v2.0 | 완성 버전 백업 |
| `webapp_backup_current_20260109_101843/` | 10:15:33 | - | v2.0 | 디렉토리 백업 |
| `webapp_backup_v2.3.0.tar.gz` | 10:18:35 | 98KB | v2.0+ | 테스트 후 백업 |

---

## 🔄 롤백 방법

### 방법 1: Git을 사용한 롤백 (권장)

#### v2.0-complete로 롤백 (원무업무 페이지 제거)
```bash
cd /home/user/webapp

# 1. 현재 상태 백업 (선택사항)
git branch backup-before-rollback

# 2. v2.0으로 롤백
git reset --hard v2.0-complete

# 3. 빌드
npm run build

# 4. 서비스 재시작
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete webapp 2>/dev/null || true
pm2 start ecosystem.config.cjs

# 5. 확인
curl http://localhost:3000
```

#### v1.0-initial로 롤백 (초기 상태로)
```bash
cd /home/user/webapp

# 1. 백업
git branch backup-before-rollback

# 2. v1.0으로 롤백
git reset --hard v1.0-initial

# 3. 데이터베이스 재설정 필요
npm run db:reset

# 4. 빌드 및 재시작
npm run build
pm2 restart webapp
```

#### 최신 버전으로 복구
```bash
cd /home/user/webapp

# 1. 최신 커밋으로 복구
git reset --hard v2.1-admissions

# 또는
git reset --hard HEAD

# 2. 빌드 및 재시작
npm run build
pm2 restart webapp
```

---

### 방법 2: 백업 파일을 사용한 롤백

#### medical_backup.tar.gz 복원 (v2.0)
```bash
# 1. 현재 디렉토리 백업
mv /home/user/webapp /home/user/webapp_backup_$(date +%Y%m%d_%H%M%S)

# 2. 백업 파일 압축 해제
cd /home/user
tar -xzf medical_backup.tar.gz

# 3. 의존성 재설치
cd /home/user/webapp
npm install

# 4. 데이터베이스 재설정
npm run db:reset

# 5. 빌드
npm run build

# 6. 서비스 시작
pm2 start ecosystem.config.cjs
```

#### webapp_backup_v2.3.0.tar.gz 복원
```bash
# 동일한 방법으로 복원
cd /home/user
mv webapp webapp_backup_old
tar -xzf webapp_backup_v2.3.0.tar.gz
cd webapp
npm install
npm run db:reset
npm run build
pm2 start ecosystem.config.cjs
```

---

## ✅ 롤백 가능 여부 체크

### v2.1-admissions → v2.0-complete
| 항목 | 상태 | 영향도 | 비고 |
|------|------|--------|------|
| 데이터베이스 | ✅ 안전 | 없음 | 스키마 변경 없음 |
| API 엔드포인트 | ✅ 안전 | 없음 | 기존 API 모두 유지 |
| 프론트엔드 | ✅ 안전 | 낮음 | 원무 메뉴만 제거됨 |
| 샘플 데이터 | ✅ 안전 | 없음 | 데이터 손실 없음 |
| **권장**: ✅ **안전하게 롤백 가능** |

**제거되는 기능:**
- 원무업무 통합 메뉴 (1개)
- 원무 통계 대시보드
- 대기환자 목록 뷰

**유지되는 기능:**
- 대시보드
- 환자 관리
- 명세서 관리
- 외부기관 연계
- 입금 관리

---

### v2.0-complete → v1.0-initial
| 항목 | 상태 | 영향도 | 비고 |
|------|------|--------|------|
| 데이터베이스 | ⚠️ 주의 | 높음 | 모든 데이터 손실 |
| API 엔드포인트 | ⚠️ 주의 | 높음 | 모든 API 제거됨 |
| 프론트엔드 | ⚠️ 주의 | 높음 | 모든 페이지 제거됨 |
| 샘플 데이터 | ❌ 위험 | 높음 | 모든 데이터 손실 |
| **권장**: ⚠️ **권장하지 않음** (테스트 목적만) |

**제거되는 모든 기능:**
- 전체 의료 청구 시스템
- 모든 데이터베이스 테이블
- 모든 API
- 모든 UI 페이지

---

## 🔍 버전별 상세 변경사항

### v2.1-admissions (현재)
**추가된 파일:**
- `FUNCTIONALITY_STATUS.md` (230줄) - 기능 상태 문서
- `test_all.sh` (23줄) - 전체 API 테스트 스크립트
- `test_post_apis.sh` (27줄) - POST API 테스트 스크립트

**수정된 파일:**
- `README.md` (+24줄) - 원무업무 설명 추가
- `public/static/app.js` (+240줄) - 원무 페이지 구현

**총 변경량:** +544줄

---

### v2.0-complete
**추가된 파일:**
- `migrations/0001_initial_schema.sql` (124줄) - DB 스키마
- `seed.sql` (53줄) - 샘플 데이터
- `ecosystem.config.cjs` (16줄) - PM2 설정
- `public/static/app.js` (843줄) - 전체 프론트엔드
- `public/static/style.css` (+77줄) - 스타일

**수정된 파일:**
- `src/index.tsx` (+658줄) - 전체 백엔드 API
- `README.md` (+364줄) - 전체 문서
- `wrangler.jsonc` (+32줄) - D1 설정
- `package.json` (+12줄) - 스크립트 추가

**총 변경량:** +2,133줄

---

## 🛠️ 롤백 후 확인사항

### 필수 확인 체크리스트
```bash
# 1. Git 상태 확인
git log --oneline -5
git status

# 2. 서비스 상태 확인
pm2 list
pm2 logs --nostream

# 3. 포트 확인
lsof -i :3000
curl http://localhost:3000

# 4. 데이터베이스 확인
npm run db:console:local
# SELECT * FROM patients LIMIT 5;

# 5. API 테스트
curl http://localhost:3000/api/patients
curl http://localhost:3000/api/dashboard/stats

# 6. 브라우저 접속
# https://3000-xxx.sandbox.novita.ai
```

---

## 📋 롤백 시나리오

### 시나리오 1: 원무 페이지에 버그 발견
```bash
# v2.0으로 롤백 (원무 페이지 제거)
git reset --hard v2.0-complete
npm run build
pm2 restart webapp

# 결과: 안정적인 5페이지 시스템으로 복구
```

### 시나리오 2: 전체 시스템 문제
```bash
# 백업 파일로 복원
cd /home/user
mv webapp webapp_broken
tar -xzf medical_backup.tar.gz
cd webapp
npm install
npm run db:reset
npm run build
pm2 start ecosystem.config.cjs

# 결과: 완전한 v2.0 시스템 복구
```

### 시나리오 3: 작업 중 실수로 파일 삭제
```bash
# Git으로 특정 파일만 복구
git checkout HEAD -- public/static/app.js
git checkout HEAD -- src/index.tsx

# 또는 전체 복구
git reset --hard HEAD
```

---

## ⚡ 빠른 롤백 명령어

### v2.0으로 롤백 (One-liner)
```bash
cd /home/user/webapp && git reset --hard v2.0-complete && npm run build && pm2 restart webapp
```

### v2.1로 복구 (One-liner)
```bash
cd /home/user/webapp && git reset --hard v2.1-admissions && npm run build && pm2 restart webapp
```

### 현재 상태 빠른 백업
```bash
cd /home/user/webapp && tar -czf ~/webapp_backup_$(date +%Y%m%d_%H%M%S).tar.gz .
```

---

## 🎯 권장사항

### ✅ 안전한 롤백
1. **v2.1 → v2.0**: 원무 페이지만 제거, 나머지 기능 유지
2. **Git 사용**: 가장 안전하고 빠른 방법
3. **태그 활용**: `v2.0-complete`, `v2.1-admissions` 태그 사용

### ⚠️ 주의가 필요한 롤백
1. **v2.0 → v1.0**: 전체 시스템 초기화 (권장 안 함)
2. **직접 파일 수정**: Git 대신 수동 수정 (권장 안 함)

### 📝 롤백 전 준비
1. 현재 데이터베이스 백업
2. Git branch 생성으로 현재 상태 보존
3. tar.gz 백업 파일 생성

---

## 📞 문제 발생 시

### 롤백 실패 시
```bash
# 1. 강제 정리
cd /home/user/webapp
git reset --hard HEAD
git clean -fd

# 2. 백업에서 복원
cd /home/user
rm -rf webapp
tar -xzf medical_backup.tar.gz

# 3. 처음부터 재설치
cd /home/user/webapp
rm -rf node_modules
npm install
npm run db:reset
npm run build
pm2 start ecosystem.config.cjs
```

---

## 📊 버전 비교표

| 기능 | v1.0 | v2.0 | v2.1 |
|------|------|------|------|
| 대시보드 | ❌ | ✅ | ✅ |
| 환자 관리 | ❌ | ✅ | ✅ |
| 명세서 관리 | ❌ | ✅ | ✅ |
| 외부기관 연계 | ❌ | ✅ | ✅ |
| 입금 관리 | ❌ | ✅ | ✅ |
| **원무업무 통합** | ❌ | ❌ | ✅ |
| 데이터베이스 | ❌ | ✅ | ✅ |
| API 엔드포인트 | 0개 | 30+ | 30+ |
| 샘플 데이터 | ❌ | ✅ | ✅ |

---

## 마지막 업데이트
2026-01-09 10:35:00 UTC
