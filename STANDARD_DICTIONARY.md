# 표준 사전 (Standard Dictionary)

이 문서는 프로젝트 전체에서 **절대 변경되면 안 되는** 표준 용어 및 규칙을 정의합니다.

## 1. 네이밍 원칙

### 1.1 케이스 규칙

| 컨텍스트 | 규칙 | 예시 |
|---------|------|------|
| DB 테이블/컬럼 | snake_case | `order_date_at_utc` |
| DB 테이블명 | 복수형 | `regions`, `stores`, `orders` |
| JSON 키 | snake_case | `{ "sku_code": "ABC123" }` |
| 코드 변수 | snake_case | `let daily_rate = 5.2` |
| React 컴포넌트 | PascalCase | `OrdersList` |
| 함수/메서드 | camelCase | `calculateROP()` |

### 1.2 키 필드 규칙

- **PK**: `{table}_id` (예: `region_id`, `order_id`)
- **FK**: 참조 테이블의 PK를 그대로 사용
- **시간**: `*_at_utc` 또는 `*_at` (UTC 고정)
- **날짜**: `*_date` (YYYY-MM-DD 형식)
- **통화**: ISO 4217 (CAD, KRW, USD)
- **수량**: `qty` (정수)
- **단가**: `unit_price` (실수/decimal)
- **외부 이벤트 ID**: `{source}_event_id`

## 2. 핵심 도메인 용어

### 2.1 엔티티 (Entity)

| 영문 | 한글 | 설명 |
|-----|------|------|
| Region | 지역 | 독립적인 운영 지역 (타임존/스케줄) |
| Entity | 거래주체 | 본사/STC/우리/가맹점 |
| Location | 위치 | 창고/매장 물리적 위치 |
| Store | 가맹점 | 최종 고객 매장 |
| Route | 배송 코스 | A코스/B코스 등 |

### 2.2 상품/재고

| 영문 | 한글 | 설명 |
|-----|------|------|
| SKU | 품목 | Stock Keeping Unit |
| Lot | 로트 | 배치 단위 재고 |
| Expiry / Expiration Date | 유통기한 | YYYY-MM-DD |
| Movement | 재고 전표 | 모든 입출고 기록 |

### 2.3 발주/재고 정책

| 영문 | 한글 | 설명 |
|-----|------|------|
| Purchase Order (PO) | 발주서 | - |
| Reorder Point (ROP) | 재주문점 | 발주 트리거 수량 |
| Safety Stock | 안전재고 | 버퍼 재고 |
| Lead Time | 리드타임 | 발주~입고 소요일 |
| MOQ | 최소주문수량 | Minimum Order Quantity |
| Pack Size | 박스입수 | 1박스당 수량 |

### 2.4 분석

| 영문 | 한글 | 설명 |
|-----|------|------|
| Forecast | 수요예측 | - |
| Deadstock Risk | 불용(폐기) 위험 | - |
| Emergency Order | 긴급 발주 | 코스 외 발주 |
| Extra Order | 추가 발주 | 정기 외 증량 |
| Regular Order | 정기 발주 | 정상 코스 발주 |

### 2.5 가격/마진

| 영문 | 한글 | 설명 |
|-----|------|------|
| Margin | 마진 | 이익 |
| COGS / Cost | 원가 | Cost of Goods Sold |
| Unit Price | 단가 | - |

## 3. Enum/상태값 표준

### 3.1 order_type (주문 타입)

| 값 | 의미 |
|----|------|
| `REGULAR` | 정기 (코스에 따른 기본 출고) |
| `EMERGENCY` | 코스 외 긴급 |
| `EXTRA` | 정기 외 추가 |

### 3.2 movement_type (재고 전표 타입)

| 값 | 의미 |
|----|------|
| `PURCHASE` | 구매/발주 발생(문서상 PO) |
| `SHIP` | 출발(한국→STC, STC→우리 등) |
| `RECEIVE` | 입고 확정 |
| `OUT` | 출고(주문 처리) |
| `RETURN` | 반품(재판매 가능) |
| `ADJUST` | 강제조정(실사/정정) |
| `WRITE_OFF` | 폐기(파손/만료) |
| `TRANSFER` | 창고/위치 이동 |

### 3.3 po_status (PO 상태)

| 값 | 의미 |
|----|------|
| `DRAFT` | 작성중 |
| `SUBMITTED` | 발주 전달됨 |
| `CONFIRMED` | 확정 |
| `IN_TRANSIT` | 운송중 |
| `RECEIVED` | 전량 입고 |
| `CANCELLED` | 취소 |

### 3.4 lot_status (로트 상태)

| 값 | 의미 |
|----|------|
| `AVAILABLE` | 사용 가능 |
| `QUARANTINE` | 격리(검수/보류) |
| `DAMAGED` | 파손 |
| `EXPIRED` | 만료 |

### 3.5 risk_level (불용 위험도)

| 값 | 의미 | 조건 |
|----|------|------|
| `HIGH` | 고위험 | D-150 내 잔여 예상 > 0 |
| `MED` | 중간 위험 | 중간 수준 |
| `LOW` | 낮음 | 위험 낮음 |

### 3.6 abc_grade (ABC 등급)

| 값 | 의미 |
|----|------|
| `A` | 상위 핵심 (매출/수량 상위) |
| `B` | 중간 |
| `C` | 낮음 |

### 3.7 store_match_method (매장 매칭 방식)

| 값 | 의미 |
|----|------|
| `CUSTOMER` | Shopify customer 기반 |
| `ADDRESS` | 배송지 주소 기반 |
| `TAG` | 태그/코드 기반 |

## 4. DB 컬럼명 표준

### 4.1 regions (지역)

- `region_id` (PK)
- `name`
- `timezone` (IANA)
- `run_days` (Mon,Tue,Wed 형식)
- `analytics_time` (HH:MM)
- `docs_time` (HH:MM)
- `slack_webhook_url`
- `shop_domain`
- `admin_token_enc`
- `webhook_secret_enc`
- `shopify_location_id`
- `store_match_method`
- `active`

### 4.2 stores (가맹점)

- `store_id` (PK)
- `region_id` (FK)
- `store_name`
- `address_line1`, `address_line2`
- `city`, `province`, `postal_code`, `country`
- `shopify_customer_id` (CUSTOMER 방식)
- `store_code` (TAG 방식)
- `match_address_key` (ADDRESS 방식)
- `active`

### 4.3 skus (품목)

- `sku_id` (PK)
- `sku_code` (unique)
- `name`
- `pack_size`
- `moq`
- `lead_time_days`
- `safety_stock_days`
- `expiry_managed`
- `abc_grade`
- `abc_lock`
- `active`

### 4.4 sku_prices (가격)

- `sku_price_id` (PK)
- `sku_id` (FK)
- `price_type` (STC_COST/OUR_COST/OUR_SUPPLY/...)
- `currency` (CAD/KRW)
- `unit_price`
- `effective_from` (YYYY-MM-DD)
- `effective_to` (YYYY-MM-DD or null)

### 4.5 orders / order_lines (주문)

**orders:**
- `order_id` (PK)
- `region_id` (FK)
- `store_id` (FK, nullable)
- `shopify_order_id` (unique)
- `order_number`
- `order_date_at_utc`
- `order_type` (REGULAR/EMERGENCY/EXTRA)
- `reason` (긴급/추가 사유)
- `currency`
- `total_amount`
- `status`

**order_lines:**
- `order_line_id` (PK)
- `order_id` (FK)
- `sku_id` (FK, nullable)
- `sku_code_snapshot`
- `qty`
- `unit_price_snapshot` (우리→가맹점 공급가)
- `unit_cost_snapshot` (STC_COST/OUR_COST)
- `margin_snapshot`

### 4.6 inventory / lots / movements (재고)

**inventory:**
- `inventory_id` (PK)
- `region_id` (FK)
- `location_id` (FK)
- `sku_id` (FK)
- `on_hand_qty`
- `reserved_qty`
- `updated_at_utc`

**lots:**
- `lot_id` (PK)
- `region_id` (FK)
- `location_id` (FK)
- `sku_id` (FK)
- `lot_code`
- `expiry_date` (YYYY-MM-DD)
- `qty`
- `received_date`
- `lot_status`

**movements:**
- `movement_id` (PK)
- `region_id` (FK)
- `movement_type`
- `sku_id` (FK)
- `from_location_id` (FK, nullable)
- `to_location_id` (FK, nullable)
- `lot_id` (FK, nullable)
- `qty`
- `related_order_id` (nullable)
- `ref_type`, `ref_id`
- `reason`
- `unit_cost_applied`
- `created_at_utc`
- `created_by_user_id`

## 5. API/버튼/기능 이름 표준

### 5.1 화면/버튼 액션

| 기능 | 버튼 키(코드) | UI 표시 |
|-----|--------------|---------|
| Regions | TEST_CONNECTION | 연결 테스트 |
| Regions | REGISTER_WEBHOOKS | 웹훅 등록 |
| Regions | RUN_INITIAL_SYNC | 초기 동기화 실행 |
| Orders | MATCH_STORE | 매장 매칭 |
| Orders | MARK_EMERGENCY | 긴급으로 분류 |
| Inventory | ADJUST_INVENTORY | 재고 강제조정 |
| Inventory | CREATE_TRANSFER | 재고 이동 |
| Pricing | ADD_PRICE | 가격 추가 |
| Reports | EXPORT_CSV | CSV 다운로드 |
| Documents | GENERATE_PDF | PDF 생성 |

### 5.2 배치 작업 이름

| job_name | 설명 |
|----------|------|
| `SYNC_SHOPIFY_ORDERS` | Shopify 주문 동기화 |
| `SYNC_SHOPIFY_INVENTORY` | Shopify 재고 동기화 |
| `DAILY_ANALYTICS` | 일일 분석 |
| `GENERATE_DOCUMENTS` | 문서 생성 |
| `RECALC_INVENTORY` | 재고 재계산 (옵션) |
| `REBUILD_REPORTS` | 리포트 재구성 (옵션) |

## 6. Shopify 이벤트/웹훅 표준

### 6.1 events 테이블 표준

- `source` = `SHOPIFY`
- `topic` = Shopify topic 그대로 (예: `orders/create`)
- `shopify_event_id` = webhook header의 고유 id
- `payload_json` = 원문 저장

### 6.2 최소 webhook topic

- `orders/create`
- `orders/updated`
- `orders/cancelled`
- `inventory_levels/update` (선택)

## 7. 리포트 지표 이름 표준

### 7.1 KPI 지표

| 지표명 | 설명 |
|--------|------|
| `stockout_risk_count` | 품절 위험 SKU 수 |
| `deadstock_high_count` | 불용 고위험 수 |
| `emergency_order_count` | 긴급 발주 건수 |
| `emergency_order_rate` | 긴급 발주 비율 |
| `gross_margin_total` | 총 마진 |
| `gross_margin_rate` | 마진율 |
| `stc_cost_total` | STC 원가 합계 |
| `our_supply_total` | 우리 공급가 합계 |
| `writeoff_qty_total` | 폐기 수량 합계 |

## 8. 파일/폴더 명명 규칙

### 8.1 백엔드 모듈

- `routes/` - 배송코스 관련
- `pricing/` - 가격 관련
- `inventory/` - 재고 관련
- `reports/` - 리포트 관련
- `connectors/shopify/` - Shopify 연동
- `jobs/` - 배치 작업
- `docs/` - 문서 생성

### 8.2 프론트엔드 페이지

- `/admin` - 관리자 메인
- `/admin/regions` - 지역 관리
- `/admin/stores` - 가맹점 관리
- `/admin/routes` - 배송코스
- `/admin/skus` - SKU 관리
- `/admin/pricing` - 가격 관리
- `/admin/inventory` - 재고 관리
- `/admin/orders` - 주문 관리
- `/admin/adjustments` - 강제조정
- `/admin/documents` - 문서
- `/admin/reports` - 리포트
- `/admin/ops` - 운영 로그

## 9. 변경 금지 원칙

이 문서의 모든 용어와 규칙은:

1. **절대 변경 금지** - 시스템 전체 일관성 유지
2. **추가만 가능** - 새 용어는 추가 가능하나 기존 용어 변경 불가
3. **전방위 적용** - DB/코드/UI/문서/리포트 모두 동일 용어 사용
4. **코드 리뷰 필수** - PR 시 표준 사전 준수 확인

## 10. 용어 추가 절차

1. GitHub Issue로 제안
2. 팀 리뷰 및 승인
3. 표준 사전 업데이트
4. 모든 문서에 반영
5. 코드에 적용

---

**마지막 업데이트**: 2026-01-16
**버전**: 1.0
**승인**: 표준 사전 위원회
