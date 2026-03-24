# admin-kit 코드 컨벤션

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | React 19 (React Compiler) + TypeScript 5.9 (strict) + Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) + Radix UI + Lucide 아이콘 |
| State | Zustand 5 (전역), TanStack React Query 5 (서버), React Hook Form 7 + Zod 4 (폼) |
| Routing | React Router v7 (loader 기반 라우트 가드) |
| API | Axios (인터셉터), MSW 2 (Mock Service Worker) |
| Testing | Vitest 4 + Testing Library + Storybook 10 + Playwright |
| i18n | i18next (ko/en), 쿠키 기반 언어 저장 |
| Lint/Format | ESLint 9 (flat config) + Prettier |

---

## 코드 스타일 규칙

### Prettier 설정
- **세미콜론 없음** (no semicolons)
- **쌍따옴표** (`"`)
- **trailing comma**: `es5`

```typescript
// 올바른 스타일
import { useState } from "react"
const items = [
  "item1",
  "item2",
]
```

### TypeScript
- **Strict mode** — implicit any 금지
- **noUnusedLocals**, **noUnusedParameters** 활성화
- enum 대신 **literal union type** 사용
- interface로 데이터 모델 정의

```typescript
// 올바른: literal union
type Status = "ACTIVE" | "INACTIVE"
// 잘못된: enum
enum Status { ACTIVE, INACTIVE }
```

### 경로 alias
- `@/` → `./src/` 로 매핑
- 절대 경로 사용 (`../../../components` 대신 `@/components`)

```typescript
import { DataTable } from "@/components/Table"
import { useAppToast } from "@/hooks/useAppToast"
```

---

## 파일 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `LoginForm.tsx` |
| 컴포넌트 폴더 | PascalCase | `LoginForm/index.ts` |
| 스토어/유틸/훅 | camelCase | `authStore.ts`, `useAppToast.tsx` |
| 페이지 ID | `SAK###` | `SAK001`(로그인), `SAK002`(대시보드) |
| 라우트 경로 | `/MNC####` | `/MNC0064` |

---

## 상태 저장 전략

| 데이터 종류 | 저장소 |
|------------|--------|
| 인증 토큰 | 쿠키 (`sak-accessToken`, `sak-refreshToken`) |
| UX 상태 (탭, 설정) | sessionStorage (`sak-tabs`, `sak-settings`) |
| i18n 언어 | 쿠키 (`i18next_language`, 365일) |
| 서버 데이터 | TanStack React Query 캐시 |

- **localStorage 사용 금지** — sessionStorage 사용
- 인증 토큰: `sameSite: lax`, accessToken 7일, refreshToken 30일

---

## Feature 모듈 구조

각 feature는 독립적인 모듈로, `index.ts`에서 공개 API를 re-export한다:

```
src/features/{feature}/
├── components/    # UI 컴포넌트 (각 폴더에 .tsx, .test.tsx, .stories.tsx)
├── hooks/         # TanStack Query mutation/query 래핑 훅
├── services/      # Axios 기반 API 호출 함수
├── stores/        # Zustand 스토어
├── types/         # feature 스코프 타입/인터페이스
├── mocks/         # MSW 핸들러 (*.mock.ts → {name}Handlers export)
└── index.ts       # 공개 API re-export
```

### index.ts 패턴
```typescript
// src/features/service/index.ts
export { PrivacyFilterPage } from "./pages/PrivacyFilterPage"
// 한 라인씩, 사용하는 것만 export
```

---

## 라우트 구조

```
src/lib/router.tsx
```

| 경로 | 페이지 | 접근 |
|------|--------|------|
| `/SAK001` | 로그인 | 미인증만 |
| `/SAK002` | 대시보드 | 인증 필요 |
| `/MNC0047` | 코드 관리 | 인증 필요 |
| `/MNC0064` | 개인정보 필터 | 인증 필요 |
| `/MNC0071` | 서비스 모니터링 | 인증 필요 |
| `/MNC0072` | 사용량 로그 | 인증 필요 |

### 라우트 가드 (loader 패턴)
- `guestLoader`: 미인증 사용자만 허용 (로그인 페이지)
- `authLoader`: 인증 사용자만 허용 (대시보드 등)
- loader에서 Zustand: `useAuthStore.getState()` (React 밖에서 접근)

---

## MSW 모킹 통합

```typescript
// src/mocks/handlers.ts — feature별 핸들러 통합
import { authHandlers } from "@/features/auth/mocks/auth.mock"
import { menuHandlers } from "@/features/dashboard/mocks/menu.mock"
import { configCodeHandlers } from "@/features/config/mocks/code.mock"
// ... 새 핸들러 import

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...configCodeHandlers,
  // ... 새 핸들러 spread
]
```

- `src/mocks/browser.ts`: 개발 서버용 (`setupWorker`)
- `src/mocks/node.ts`: Vitest용 (`setupServer`)

---

## i18n 번역 규칙

- 번역 파일: `src/i18n/ko.json`, `src/i18n/en.json`
- **모든 UI 문자열은 `t()` 함수로 처리**
- 영어 번역: 빈 문자열인 값만 번역, 이미 번역된 값 유지
- 변수 위치는 영어 문법에 맞게 조정

```typescript
const { t } = useTranslation()
// 사용 예:
t("저장")
t("{{name}} 삭제", { name: item.title })
```

---

## 공통 컴포넌트 위치

| 컴포넌트 | import 경로 |
|----------|-------------|
| DataTable | `@/components/Table` |
| DetailSheet, DetailSheetForm | `@/components/DetailSheet` |
| ConfirmDialog | `@/components/ConfirmDialog` |
| Button, Badge, Card, Dialog, ... | `@/components/ui/*` |
| DropdownMenu | `@/components/ui/dropdown-menu` |

---

## 공통 훅/유틸

| 훅/유틸 | 경로 | 용도 |
|---------|------|------|
| `useAppToast` | `@/hooks/useAppToast` | 토스트 알림 (`toast.success/error/warning`) |
| `formatDateTime` | `@/utils/date` | ISO 날짜 → 한국어 포맷 |
| `cn()` | `@/lib/utils` | Tailwind 클래스 병합 |
