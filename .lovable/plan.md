

# 할인 코드 금액 변경 (20,000원 → 10,000원)

## 개요
할인 코드의 기본 할인 금액을 20,000원에서 10,000원으로 변경합니다.

---

## 수정 파일

### 1. `src/pages/DiscountCodesAdmin.tsx`
관리자 페이지에서 할인 코드 생성 시 적용되는 금액 변경

```typescript
// 변경 전
discount_amount: 20000,

// 변경 후
discount_amount: 10000,
```

### 2. `supabase/functions/generate-discount-code/index.ts`
Edge Function에서 할인 코드 생성 시 적용되는 금액 변경

```typescript
// 변경 전
discount_amount: 20000,

// 변경 후
discount_amount: 10000,
```

이메일 템플릿의 할인 금액 표시도 함께 변경:
- `20,000원 할인` → `10,000원 할인`

### 3. 데이터베이스 마이그레이션
`discount_codes` 테이블의 기본값 변경

```sql
ALTER TABLE discount_codes 
ALTER COLUMN discount_amount SET DEFAULT 10000;
```

---

## 참고 사항

| 항목 | 내용 |
|------|------|
| 기존 코드 | 이미 발급된 20,000원 코드는 그대로 유지됨 |
| 신규 코드 | 변경 후 생성되는 코드만 10,000원 적용 |
| 레퍼럴 코드 | 별도 시스템으로 이미 10,000원으로 설정됨 |

---

## 예상 결과

1. 관리자 페이지에서 새로 생성하는 할인 코드: 10,000원
2. Edge Function으로 자동 생성되는 할인 코드: 10,000원
3. 이메일 안내 문구: "10,000원 할인"으로 표시

