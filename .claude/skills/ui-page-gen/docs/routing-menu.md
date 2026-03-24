# 라우팅 및 메뉴 추가 가이드

새 페이지를 만들 때 수정해야 하는 파일 4개와 수정 방법.

---

## 1. `src/lib/router.tsx` — 라우트 추가

### 현재 구조

```tsx
import { createBrowserRouter, redirect } from "react-router"
import { CodeManagementPage } from "@/features/config"
import { PrivacyFilterPage } from "@/features/service"
import { AccessLogPage, UsageLogPage } from "@/features/log"
import { GuestLayout, useAuthStore } from "@/features/auth"
import { AuthLayout } from "@/features/dashboard"

export const router = createBrowserRouter([
  // 루트 리다이렉트
  { path: "/", loader: rootLoader },

  // 로그인 (미인증만)
  {
    element: <GuestLayout />,
    loader: guestLoader,
    children: [{ path: "/SAK001", element: <SAK001 /> }],
  },

  // 인증 필요 라우트
  {
    element: <AuthLayout />,
    loader: authLoader,
    children: [
      { path: "/SAK002", element: <SAK002 /> },
      { path: "/MNC0064", element: <PrivacyFilterPage /> },
      { path: "/MNC0047", element: <CodeManagementPage /> },
      { path: "/MNC0071", element: <AccessLogPage /> },
      { path: "/MNC0072", element: <UsageLogPage /> },
      // ↑ 여기에 새 라우트 추가
    ],
  },
])
```

### 새 라우트 추가

1. **import 추가** (파일 상단):
```tsx
import { NewPage } from "@/features/{feature}"
```

2. **children에 라우트 추가** (AuthLayout children 안):
```tsx
{ path: "/{ROUTE}", element: <NewPage /> },
```

---

## 2. `src/features/{feature}/index.ts` — 페이지 export

```typescript
// 기존 export들
export { PrivacyFilterPage } from "./pages/PrivacyFilterPage"

// 새 페이지 추가
export { NewPage } from "./pages/NewPage"
```

---

## 3. `src/mocks/handlers.ts` — MSW 핸들러 등록

### 현재 구조

```typescript
import { authHandlers } from "@/features/auth/mocks/auth.mock"
import { menuHandlers } from "@/features/dashboard/mocks/menu.mock"
import { configCodeHandlers } from "@/features/config/mocks/code.mock"
import { gbUserHandlers } from "@/features/service/mocks/gbUser.mock"
import { privacyFilterHandlers } from "@/features/service/mocks/privacyFilter.mock"
import { accessLogHandlers } from "@/features/log/mocks/accessLog.mock"
import { usageLogHandlers } from "@/features/log/mocks/usageLog.mock"

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...configCodeHandlers,
  ...gbUserHandlers,
  ...privacyFilterHandlers,
  ...accessLogHandlers,
  ...usageLogHandlers,
]
```

### 새 핸들러 추가

1. **import 추가**:
```typescript
import { {name}Handlers } from "@/features/{feature}/mocks/{name}.mock"
```

2. **handlers 배열에 spread 추가**:
```typescript
export const handlers = [
  // 기존 핸들러들
  ...{name}Handlers,   // 새로 추가
]
```

---

## 4. `src/features/dashboard/mocks/menu.mock.ts` — 사이드바 메뉴 추가

### 메뉴 구조

```typescript
const mockMenuData: MenuItem[] = [
  // SAK002: 대시보드 (menuSeq: 1)
  // MNP0003: 서비스 관리 (부모, menuSeq: 2)
  //   MNC0064: 개인정보 필터 (menuSeq: 3)
  // MNP0004: 로그 관리 (부모, menuSeq: 4)
  //   MNC0071: 서비스 모니터링 (menuSeq: 5)
  //   MNC0072: 사용량 로그 (menuSeq: 6)
  // MNP0018: 환경설정 (부모, menuSeq: 7)
  //   MNC0047: 코드 관리 (menuSeq: 8)
]
```

### 새 메뉴 항목 추가

기존 항목과 같은 그룹이면 `rootMenuId`를 부모 menuId로 설정:

```typescript
{
  menuUuid: "a1b2c3d4e5f6789012345678901234ab",  // 임의의 32자 hex
  menuSeq: 9,                                       // 다음 순번
  menuId: "MNC0080",                               // 새 라우트 ID
  rootMenuId: "MNP0018",                           // 부모 메뉴 ID (환경설정 그룹)
  menuNm: "공지사항 관리",
  engMenuNm: "Notice Management",
  menuDesc: "시스템 공지사항 관리",
  menuIcon: "megaphone",                           // lucide 아이콘명
  useYn: "Y",
  visibleYn: "Y",
  allYn: "Y",
  readYn: "Y",
  createYn: "Y",   // readonly 패턴이면 "N"
  updateYn: "Y",   // readonly 패턴이면 "N"
  deleteYn: "Y",   // readonly 패턴이면 "N"
},
```

### menuSeq 재정렬

새 메뉴 추가 후 `menuSeq`가 연속되도록 재정렬합니다.
단, 기존 항목들의 menuSeq를 변경하면 순서가 바뀔 수 있으므로
맨 끝에 다음 순번으로 추가하는 것이 안전합니다.

### 새 부모 메뉴 그룹 추가

완전히 새로운 그룹이 필요하면 부모 먼저 추가:

```typescript
// 부모 메뉴 그룹 (rootMenuId: "")
{
  menuUuid: "부모UUID_32자",
  menuSeq: 9,
  menuId: "MNP0020",          // 새 부모 ID
  rootMenuId: "",              // 최상위
  menuNm: "신규 메뉴 그룹",
  engMenuNm: "New Menu Group",
  menuDesc: "신규 그룹 설명",
  menuIcon: "folder",
  useYn: "Y",
  visibleYn: "Y",
  allYn: "Y",
  readYn: "Y",
  createYn: "Y",
  updateYn: "Y",
  deleteYn: "Y",
},
// 자식 메뉴
{
  menuUuid: "자식UUID_32자",
  menuSeq: 10,
  menuId: "MNC0081",
  rootMenuId: "MNP0020",       // 위 부모 ID
  menuNm: "하위 메뉴",
  // ...
},
```

---

## menuIcon — Lucide 아이콘명

사이드바에서 사용되는 Lucide 아이콘명 예시:

| 용도 | 아이콘명 |
|------|---------|
| 대시보드 | `layout-dashboard` |
| 서버/API | `server` |
| 보안/필터 | `shield-alert` |
| 로그/기록 | `scroll-text` |
| 모니터링 | `file-clock` |
| 차트/통계 | `bar-chart-3` |
| 환경설정 | `settings` |
| 데이터베이스 | `database` |
| 파일 | `file-text` |
| 공지사항 | `megaphone` |
| 사용자 | `users` |
| 권한/역할 | `shield` |
| 알림 | `bell` |
| 프록시/네트워크 | `network` |

[전체 아이콘 목록](https://lucide.dev/icons/) 참조

---

## MenuItem 타입

```typescript
interface MenuItem {
  menuUuid: string       // 고유 UUID (32자 hex)
  menuSeq: number        // 정렬 순서
  menuId: string         // 라우트 ID (예: MNC0064, MNP0003)
  rootMenuId: string     // 부모 menuId (최상위는 "")
  menuNm: string         // 한국어 메뉴 이름
  engMenuNm: string      // 영문 메뉴 이름
  menuDesc: string       // 설명
  menuIcon: string       // lucide 아이콘명
  useYn: "Y" | "N"      // 사용 여부
  visibleYn: "Y" | "N"  // 사이드바 노출 여부
  allYn: "Y" | "N"
  readYn: "Y" | "N"     // 읽기 권한
  createYn: "Y" | "N"   // 생성 권한
  updateYn: "Y" | "N"   // 수정 권한
  deleteYn: "Y" | "N"   // 삭제 권한
}
```
