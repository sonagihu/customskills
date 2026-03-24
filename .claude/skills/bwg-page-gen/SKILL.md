---
name: bwg-page-gen
description: bwg-admin-kit 프로젝트에서 새로운 메뉴와 페이지를 생성합니다. 기술 구조, 스타일, 컴포넌트, 라우팅까지 완전한 feature 모듈을 scaffold합니다.
user-invocable: true
argument-hint: "<페이지명> [패턴: crud-basic|crud-nested|readonly-detail|summary-table]"
---

# bwg-page-gen — bwg-admin-kit 페이지 생성 스킬

이 스킬은 bwg-admin-kit 프로젝트에서 새로운 메뉴 및 Feature 페이지를 생성합니다.
**프로젝트를 직접 읽지 않아도** 이 스킬 디렉토리에 포함된 템플릿과 가이드만으로 완전한 페이지를 만들 수 있습니다.

---

## 1단계 — 요구사항 수집

다음 정보를 사용자에게 확인합니다 (이미 제공된 경우 생략):

| 항목 | 예시 |
|------|------|
| **페이지 한국어 이름** | 공지사항 관리 |
| **영문 이름 (camelCase)** | notice |
| **라우트 ID (MNC####)** | MNC0080 |
| **소속 feature 디렉토리** | `src/features/config/` |
| **메뉴 부모 ID** | MNP0018 (환경설정) |
| **UI 패턴** | crud-basic / crud-nested / readonly-detail / summary-table |
| **데이터 필드 목록** | id, title, content, useYn, ... |
| **API 기본 경로** | /api/config/notice |

---

## 2단계 — UI 패턴 선택

### `crud-basic` (기본 CRUD)
- DataTable + DetailSheet 슬라이드 패널
- 오른쪽 패널에서 추가/수정/삭제
- 행 클릭 → DetailSheet 열림, DropdownMenu 액션 (수정/삭제)
- React Hook Form + Zod 유효성 검사
- **참조 템플릿:** `templates/crud-basic.tsx`

### `crud-nested` (중첩 CRUD)
- `crud-basic`과 동일하나 DetailSheet 안에 추가 **편집 가능한 DataTable** 포함
- 부모-자식 관계 데이터 (예: 코드 그룹 + 코드 값)
- `detailDirty` 상태로 내부 테이블 변경 추적
- **참조 템플릿:** `templates/crud-nested.tsx`

### `readonly-detail` (읽기 전용 + Dialog 상세)
- 읽기 전용 DataTable + 행 클릭 시 **shadcn Dialog** 상세 조회
- CSV 다운로드 버튼
- `useLocation` state로 초기 필터 설정 가능
- **참조 템플릿:** `templates/readonly-detail.tsx`

### `summary-table` (요약 카드 + 테이블)
- 상단 집계 Card 4개 + 읽기 전용 DataTable
- 두 개의 useQuery (목록 + 요약)
- CSV 다운로드 버튼
- **참조 템플릿:** `templates/summary-table.tsx`

---

## 3단계 — 생성할 파일 목록

`{feature}` = 소속 feature 디렉토리 이름 (예: config, service, log)
`{Name}` = PascalCase 이름 (예: Notice)
`{name}` = camelCase 이름 (예: notice)
`{ROUTE}` = 라우트 ID (예: MNC0080)

```
src/features/{feature}/
├── types/{name}.types.ts          ← 타입 정의
├── services/{name}Service.ts      ← Axios 서비스
├── mocks/{name}.mock.ts           ← MSW 핸들러
└── pages/{Name}Page.tsx           ← 페이지 컴포넌트
```

**수정할 파일 4개:**
```
src/features/{feature}/index.ts            ← {Name}Page export 추가
src/mocks/handlers.ts                      ← {name}Handlers import/spread 추가
src/lib/router.tsx                         ← 라우트 추가
src/features/dashboard/mocks/menu.mock.ts  ← 메뉴 항목 추가
```

---

## 4단계 — 파일 생성 규칙

### 코드 스타일 (MUST)
- **세미콜론 없음**, 쌍따옴표, trailing comma (es5)
- Strict TypeScript: any 금지, 모든 타입 명시
- `@/` 경로 alias 사용 (예: `@/components/Table`)
- `useTranslation()` + `t()` 로 모든 UI 문자열 처리
- `useAppToast()` for 토스트 알림

### types.ts 패턴
→ `docs/conventions.md` 참조
→ `templates/types-example.ts` 참조

```typescript
export interface {Name}Item {
  {idField}: string
  // ... 필드들
  regUserId?: string
  regOccurDttm?: string
  modUserId?: string
  modOccurDttm?: string
}
```

### service.ts 패턴
→ `templates/service-example.ts` 참조

```typescript
import axios from "@/lib/axios"
import type { {Name}Item } from "../types/{name}.types"

export const {name}Service = {
  async getList(): Promise<{Name}Item[]> { ... },
  async create(payload: Partial<{Name}Item>): Promise<{Name}Item> { ... },
  async update(id: string, payload: Partial<{Name}Item>): Promise<{Name}Item> { ... },
  async delete(id: string): Promise<void> { ... },
}
```

### mock.ts 패턴
→ `templates/mock-example.ts` 참조

- `http.get/post/put/delete` 4개 핸들러
- in-memory 배열 (`const store: {Name}Item[] = [...]`) 으로 상태 유지
- `export const {name}Handlers = [...]`

### Page 컴포넌트 패턴
→ 선택한 패턴의 템플릿 파일 참조

- `export function {Name}Page() { ... }`
- `export default {Name}Page` (마지막 줄)

---

## 5단계 — 수정 가이드

### `src/features/{feature}/index.ts`
```typescript
// 기존 export 아래에 추가
export { {Name}Page } from "./pages/{Name}Page"
```

### `src/mocks/handlers.ts`
```typescript
// import 섹션에 추가
import { {name}Handlers } from "@/features/{feature}/mocks/{name}.mock"

// handlers 배열에 spread 추가
export const handlers = [
  // ... 기존 핸들러들
  ...{name}Handlers,
]
```

### `src/lib/router.tsx`
```typescript
// import에 {Name}Page 추가
import { {Name}Page } from "@/features/{feature}"

// AuthLayout children에 라우트 추가
{
  path: "/{ROUTE}",
  element: <{Name}Page />,
},
```

### `src/features/dashboard/mocks/menu.mock.ts`
메뉴 항목을 `mockMenuData` 배열에 추가합니다.
메뉴 구조는 flat 배열로, `rootMenuId`로 부모를 지정합니다.

```typescript
{
  menuUuid: "생성된_UUID_32자",  // 임의의 32자 hex 문자열
  menuSeq: {다음_순번},
  menuId: "{ROUTE}",
  rootMenuId: "{부모_menuId}",  // 예: "MNP0018"
  menuNm: "{한국어 메뉴 이름}",
  engMenuNm: "{영문 메뉴 이름}",
  menuDesc: "{설명}",
  menuIcon: "{lucide-icon-name}",  // lucide 아이콘명 (예: "file-text")
  useYn: "Y",
  visibleYn: "Y",
  allYn: "Y",
  readYn: "Y",
  createYn: "Y",   // readonly 페이지는 "N"
  updateYn: "Y",   // readonly 페이지는 "N"
  deleteYn: "Y",   // readonly 페이지는 "N"
},
```

---

## 6단계 — 검증

생성 완료 후 다음을 확인합니다:

```bash
# 타입 체크
npx tsc --noEmit

# 개발 서버
npm run dev
```

체크리스트:
- [ ] 새 라우트 (`/{ROUTE}`) 브라우저에서 로드됨
- [ ] 사이드바에 새 메뉴 노출됨
- [ ] 데이터 목록 조회 (MSW mock 응답)
- [ ] 추가/수정/삭제 동작 (crud 패턴인 경우)
- [ ] TypeScript 에러 없음

---

## 참조 문서

- `docs/conventions.md` — 프로젝트 전체 코드 컨벤션
- `docs/component-datatable.md` — DataTable 컴포넌트 완전 가이드
- `docs/component-detailsheet.md` — DetailSheet 컴포넌트 완전 가이드
- `docs/component-confirm-dialog.md` — ConfirmDialog 컴포넌트 가이드
- `docs/routing-menu.md` — 라우팅 및 메뉴 구조 가이드
- `templates/crud-basic.tsx` — 기본 CRUD 페이지 전체 소스
- `templates/crud-nested.tsx` — 중첩 CRUD 페이지 전체 소스
- `templates/readonly-detail.tsx` — 읽기 전용+Dialog 페이지 전체 소스
- `templates/summary-table.tsx` — 요약카드+테이블 페이지 전체 소스
- `templates/service-example.ts` — Service 파일 예시
- `templates/mock-example.ts` — MSW Mock 파일 예시
- `templates/types-example.ts` — Types 파일 예시
