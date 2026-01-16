# 배포 가이드 (Deployment Guide)

## 🚀 Vercel 배포

### 1. Turso 데이터베이스 생성

```bash
# Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# 로그인
turso auth login

# 데이터베이스 생성
turso db create inven-production

# 연결 정보 확인
turso db show inven-production

# 토큰 생성
turso db tokens create inven-production
```

### 2. Vercel 프로젝트 설정

1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정:

```
TURSO_DATABASE_URL=libsql://[your-db].turso.io
TURSO_AUTH_TOKEN=[your-token]
ENCRYPTION_KEY=[generate-32-char-random-string]
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. 데이터베이스 스키마 푸시

```bash
# 로컬에서 실행
npm run db:push
```

### 4. GitHub Secrets 설정

Repository Settings → Secrets and variables → Actions

```
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
ENCRYPTION_KEY
```

## 📋 운영 체크리스트

### 초기 설정

- [ ] Turso 데이터베이스 생성 및 스키마 푸시
- [ ] Vercel 프로젝트 생성 및 환경 변수 설정
- [ ] GitHub Actions Secrets 설정
- [ ] Vercel 도메인 연결
- [ ] 첫 번째 Region 생성
- [ ] Shopify 앱 생성 및 API 토큰 발급
- [ ] Webhook 등록 (orders/create, orders/updated)
- [ ] Slack Webhook URL 설정 (선택)

### 일일 운영

- [ ] 미매칭 주문 확인 및 매장 연결
- [ ] 긴급 발주 사유 검토
- [ ] 불용 위험 SKU 확인
- [ ] 재고 추천 검토
- [ ] PDF 문서 다운로드 및 전달

### 주간 운영

- [ ] ABC 등급 검토
- [ ] 가격 변동 확인
- [ ] 배치 작업 로그 검토
- [ ] 긴급발주율 KPI 분석

## 🔧 트러블슈팅

### 웹훅이 작동하지 않는 경우

1. Shopify Admin → Settings → Notifications → Webhooks 확인
2. HMAC 검증 로그 확인 (Vercel Logs)
3. Webhook URL이 HTTPS인지 확인
4. webhook_secret_enc가 올바르게 저장되었는지 확인

### 배치 작업이 실행되지 않는 경우

1. GitHub Actions 탭에서 워크플로우 확인
2. GitHub Secrets 설정 확인
3. job_runs 테이블에서 에러 메시지 확인
4. region의 run_days 및 analytics_time 확인

### 데이터베이스 연결 오류

1. TURSO_DATABASE_URL 형식 확인 (libsql://...)
2. TURSO_AUTH_TOKEN 유효성 확인
3. Turso 데이터베이스 상태 확인: `turso db show [db-name]`

## 📊 성능 최적화

### 인덱스 최적화

모든 주요 조회 컬럼에 인덱스 설정 완료:
- orders: shopify_order_id, region_id+order_date, store_id
- inventory: location_id+sku_id, region_id+sku_id
- movements: region_id+movement_type, sku_id, created_at

### 쿼리 최적화

- 집계 테이블 사용 (emergency_kpi_daily)
- 페이지네이션 적용 (limit 100)
- 인덱스 기반 정렬 (orderBy)

## 🔐 보안 권장사항

1. **환경 변수 보호**
   - Vercel 환경 변수만 사용
   - .env 파일 절대 커밋 금지

2. **API 접근 제한**
   - Shopify webhook만 외부 접근
   - Admin UI는 인증 추가 권장

3. **토큰 관리**
   - 정기적인 Shopify 토큰 갱신
   - Turso 토큰 rotate 고려

4. **감사 로그**
   - 모든 중요 변경 기록
   - 정기적인 로그 백업

5. **의존성 관리**
   - 정기적인 보안 업데이트
   - Next.js 14.2.35 이상 사용 (보안 패치 적용)
   - `npm audit` 정기 실행

## 🔄 업데이트 및 롤백

### 코드 업데이트

```bash
git pull origin main
npm install
npm run build
```

Vercel은 자동 배포

### 스키마 변경

```bash
# 1. 스키마 변경 (db/schema.ts)
# 2. 마이그레이션 생성
npm run db:generate

# 3. 프로덕션 적용 전 백업
turso db shell inven-production ".backup backup.db"

# 4. 적용
npm run db:push
```

### 롤백

```bash
# Git 롤백
git revert [commit-hash]
git push

# DB 롤백 (백업에서 복원)
turso db shell inven-production ".restore backup.db"
```

## 📈 모니터링

### Vercel Analytics
- 페이지 로딩 시간
- API 응답 시간
- 에러율

### GitHub Actions
- 배치 작업 성공률
- 실행 시간
- 에러 로그

### 커스텀 모니터링
- job_runs 테이블에서 FAILED 상태 확인
- Slack 알림으로 즉시 통지

## 🆘 긴급 대응

### 시스템 다운 시

1. Vercel Status 확인
2. Turso Status 확인
3. GitHub Actions 로그 확인
4. Shopify Webhook 재전송

### 데이터 손실 시

1. 최근 백업 확인
2. Shopify에서 주문 재동기화
3. 감사 로그로 변경 이력 추적

## 📞 지원

- GitHub Issues: 버그 리포트
- Discussions: 기능 제안 및 질문
- Vercel Support: 배포 관련
- Turso Discord: DB 관련
