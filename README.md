# Inven - 글로벌 멀티지역 재고/발주/가격/마진 통합 운영 시스템

캐나다 여러 지역(밴쿠버/토론토/알버타 등)에서 운영되는 **Shopify 기반 재고/발주/가격/마진/3PL(STC) 통합 운영 시스템**입니다.

## 🎯 핵심 미션

1. **품절 방지** - 리드타임/안전재고/ROP 기반 자동 발주 추천
2. **폐기 방지** - 유통기한 기반 불용 예측 (D-150)
3. **다단계 가격/마진 추적** - STC 마진 + 우리 마진
4. **긴급/추가발주 관리** - 정규 흐름에 포함하되 KPI로 분리 관리
5. **협업/감사** - 댓글, 강제조정, 반품/불량, 변경 이력

## 🏗 시스템 아키텍처

```
┌──────────────────┐
│     Shopify      │
│  (Source of      │
│     Truth)       │
└────────┬─────────┘
         │ webhooks
         ▼
┌──────────────────────────────┐
│   Next.js (Vercel)           │
│   - Admin UI                 │
│   - API Routes               │
│   - Webhook Handler          │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   Turso/D1 (SQLite)          │
│   - All data storage         │
└──────────────────────────────┘
           ▲
           │
┌──────────┴───────────────────┐
│   GitHub Actions             │
│   - Scheduler (10분마다)     │
│   - Analytics Job            │
│   - Documents Generation     │
└──────────────────────────────┘
```

## 📊 표준 사전 (Standard Dictionary)

### 네이밍 원칙

- **DB/코드/JSON**: `snake_case`
- **테이블명**: 복수형 (`regions`, `stores`, `orders`)
- **PK**: `{table}_id` (예: `region_id`)
- **FK**: 참조 테이블 PK를 그대로 사용
- **시간**: `*_at_utc` (UTC 고정, UI만 timezone 변환)
- **통화**: ISO 4217 (`CAD`, `KRW`)
- **수량**: `qty` (정수), `unit_price` (실수)

### 핵심 도메인 용어

| 표준 용어 | UI 표시 |
|----------|---------|
| Region | 지역 |
| Store | 가맹점 |
| Route | 배송 코스 (A/B 등) |
| SKU | 품목 |
| Lot | 로트 |
| Movement | 재고 전표 |
| ROP | 재주문점 |
| MOQ | 최소주문수량 |
| Pack Size | 박스입수 |
| Forecast | 수요예측 |

### Enum/상태값 표준

#### order_type (주문 타입)
- `REGULAR` - 정기 (코스에 따른 기본 출고)
- `EMERGENCY` - 코스 외 긴급
- `EXTRA` - 정기 외 추가

#### movement_type (재고 전표 타입)
- `PURCHASE` - 구매/발주 발생
- `SHIP` - 출발
- `RECEIVE` - 입고 확정
- `OUT` - 출고
- `RETURN` - 반품
- `ADJUST` - 강제조정
- `WRITE_OFF` - 폐기
- `TRANSFER` - 창고/위치 이동

#### store_match_method (매장 매칭 방식)
- `CUSTOMER` - Shopify customer 기반
- `ADDRESS` - 배송지 주소 기반
- `TAG` - 태그/코드 기반

## 🚀 시작하기

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/yonghuni912-create/Inven.git
cd Inven

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 실제 값 입력
```

### 2. 환경 변수

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Encryption (32자 이상)
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 데이터베이스 초기화

```bash
# Drizzle 스키마 푸시
npm run db:push

# (선택) Drizzle Studio 실행
npm run db:studio
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📁 프로젝트 구조

```
inven-system/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin UI Pages
│   │   ├── regions/       # 지역 관리
│   │   ├── stores/        # 가맹점 관리
│   │   ├── routes/        # 배송 코스 관리
│   │   ├── skus/          # SKU 관리
│   │   ├── pricing/       # 가격 관리
│   │   ├── inventory/     # 재고 관리
│   │   ├── orders/        # 주문 관리
│   │   ├── adjustments/   # 강제조정
│   │   ├── documents/     # 문서 관리
│   │   ├── reports/       # 리포트
│   │   └── ops/           # 운영 로그
│   └── api/               # API Routes
│       └── webhooks/      # Shopify Webhooks
├── db/                    # Database
│   ├── schema.ts          # Drizzle Schema (23개 테이블)
│   └── index.ts           # DB Client
├── lib/                   # Utilities
│   ├── shopify.ts         # Shopify API Client
│   ├── encryption.ts      # 암호화 유틸
│   ├── datetime.ts        # 타임존 처리
│   ├── store-matching.ts  # 매장 매칭
│   ├── order-classification.ts  # 주문 분류
│   ├── inventory-calculations.ts  # 재고 계산
│   ├── deadstock-analysis.ts  # 불용 분석
│   └── slack.ts           # Slack 알림
├── jobs/                  # Batch Jobs
│   ├── scheduler.js       # 메인 스케줄러
│   ├── sync-shopify-orders.js
│   ├── daily-analytics.js
│   └── generate-documents.js
└── .github/workflows/     # GitHub Actions
    └── scheduled-jobs.yml
```

## 💾 데이터베이스 스키마

### 핵심 테이블 (23개)

1. **regions** - 지역 설정 + Shopify 연결
2. **stores** - 가맹점 마스터
3. **routes** - 배송 코스
4. **store_routes** - 매장-코스 매핑
5. **skus** - SKU 마스터
6. **sku_prices** - 가격 히스토리 (다단계)
7. **locations** - 창고/위치
8. **inventory** - 위치별 현재고
9. **lots** - 로트별 재고 + 유통기한
10. **movements** - 재고 전표 (모든 입출고)
11. **orders** - Shopify 주문 헤더
12. **order_lines** - 주문 라인 아이템
13. **forecast** - 수요 예측
14. **abc_classification** - ABC 등급
15. **replenishment_recommendations** - 발주 추천
16. **deadstock_risk** - 불용 위험
17. **comments** - 협업/댓글
18. **audit_logs** - 감사 로그
19. **events** - Shopify 웹훅 원본
20. **users** - 사용자
21. **documents** - 생성된 문서 기록
22. **emergency_kpi_daily** - 긴급발주 KPI
23. **job_runs** - 배치 작업 로그

## 🔄 핵심 기능 Flow

### 1. Shopify 주문 수집

```
Shopify Webhook → Verify HMAC → Idempotency Check 
→ Save Event → Process Order → Match Store 
→ Classify Order Type → Save Order + Lines
```

### 2. 매장 자동 매칭

```
Order arrives → Check match_method
├─ CUSTOMER: customer_id → store_id
├─ ADDRESS: normalized address → best match
└─ TAG: tag/store_code → store_id
→ If no match: store_id = NULL (Unmatched queue)
```

### 3. 정기/긴급 분류

```
Order created → Determine today's route
├─ Store in today's route → REGULAR
└─ Store NOT in route → EMERGENCY (+ reason)
```

### 4. 발주 추천 (ROP/MOQ/Pack)

```
Daily Analytics
→ Calculate daily_rate (30/60/90)
→ ROP = daily_rate × (lead_time + safety_stock)
→ raw_order = max(0, ROP - on_hand)
→ Apply MOQ
→ Round up to pack_size
→ Save recommendations
```

### 5. 불용 예측 (D-150)

```
For each lot (expiry managed)
→ days_to_expiry
→ expected_consume = daily_rate × days
→ expected_leftover = lot_qty - expected_consume
→ If leftover > 0 and days <= 150: HIGH risk
→ Suggest action: PROMO/BUNDLE/TRANSFER/STOP_PURCHASE
```

## 🤖 배치 작업

### GitHub Actions 스케줄러

- **실행 주기**: 10분마다
- **작업 결정**: DB의 regions 설정 기반
- **작업 종류**:
  1. `SYNC_SHOPIFY_ORDERS` - Shopify 주문 동기화
  2. `DAILY_ANALYTICS` - 일일 분석 (ROP, 불용, ABC)
  3. `GENERATE_DOCUMENTS` - 문서 생성 (피킹리스트, PO)

### 실행 조건

```javascript
shouldRun = 
  region.active === true 
  && todayInRunDays(region.run_days)
  && isPastScheduledTime(region.analytics_time)
  && !alreadyRanToday(job_name, region_id, run_date)
```

## 📱 Admin UI 화면

### 주요 페이지

1. **Dashboard** - KPI 요약 (지역 상태, 주문 통계)
2. **Regions** - 지역별 Shopify 연결 관리
3. **Stores** - 가맹점 등록 및 매칭 설정
4. **Routes** - A/B 코스 및 스케줄 관리
5. **SKUs** - SKU 마스터 + MOQ/Lead/Safety 정책
6. **Pricing** - 다단계 가격 (STC_COST → OUR_SUPPLY)
7. **Inventory** - 재고 현황 + 로트 관리
8. **Orders** - 주문 목록 + 미매칭 처리
9. **Adjustments** - 재고 강제조정 + 감사 로그
10. **Documents** - 생성된 PDF 관리
11. **Reports** - 긴급발주/불용/마진/ABC 리포트
12. **Ops Logs** - 배치 작업 실행 이력

## 🔐 보안

- **Shopify 토큰 암호화**: AES encryption (ENCRYPTION_KEY)
- **웹훅 검증**: HMAC SHA256 verification
- **Idempotency**: shopify_event_id로 중복 방지
- **감사 로그**: 모든 중요 변경 기록

## 📊 리포트 지표

### KPI (표준)

- `stockout_risk_count` - 품절 위험 SKU 수
- `deadstock_high_count` - 고위험 불용재고 수
- `emergency_order_count` - 긴급 발주 건수
- `emergency_order_rate` - 긴급 발주 비율
- `gross_margin_total` - 총 마진
- `gross_margin_rate` - 마진율
- `stc_cost_total` - STC 원가 합계
- `our_supply_total` - 우리 공급가 합계
- `writeoff_qty_total` - 폐기 수량 합계

## 🔔 Slack 알림

### 알림 종류

1. **품절 위험** - ROP 미달 SKU 알림
2. **불용 위험** - D-150 내 예상 잔여 재고
3. **일일 요약** - 긴급발주율, 총 주문 수

### 설정

regions 테이블의 `slack_webhook_url`에 Webhook URL 설정

## 🛠 개발 가이드

### 새 기능 추가

1. **DB 스키마 변경**
   ```bash
   # db/schema.ts 수정
   npm run db:generate
   npm run db:push
   ```

2. **API 추가**
   ```typescript
   // app/api/your-endpoint/route.ts
   export async function GET(req: NextRequest) {
     // ...
   }
   ```

3. **UI 페이지 추가**
   ```typescript
   // app/admin/your-page/page.tsx
   export default function YourPage() {
     // ...
   }
   ```

### 코드 스타일

- TypeScript strict mode
- snake_case for DB/API
- camelCase for React components
- 한글 주석 권장 (도메인 용어는 영문)

## 📝 라이선스

MIT License

## 🤝 기여

이 프로젝트는 표준 사전(Standard Dictionary)을 엄격히 준수합니다.
PR 제출 시 네이밍 규칙 및 Enum 값을 반드시 확인하세요.

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요.
