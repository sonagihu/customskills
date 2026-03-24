# ConfirmDialog 컴포넌트 가이드

`@/components/ConfirmDialog` — 사용자 확인이 필요한 작업(삭제 등)에 사용하는 모달 다이얼로그.

---

## Import

```tsx
import { ConfirmDialog } from "@/components/ConfirmDialog"
```

---

## Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `open` | `boolean` | — | 다이얼로그 열림 여부 |
| `onOpenChange` | `(open: boolean) => void` | — | 열림/닫힘 상태 변경 |
| `onConfirm` | `() => void \| Promise<void>` | — | 확인 버튼 클릭 시 (async 가능) |
| `title` | `string` | — | 다이얼로그 제목 |
| `description` | `string` | — | 본문 설명 (선택적) |
| `variant` | `"default" \| "info" \| "warning" \| "error"` | `"default"` | 다이얼로그 스타일 |
| `confirmButtonName` | `string` | `"확인"` | 확인 버튼 텍스트 |
| `confirmVariant` | `"default" \| "destructive" \| "outline" \| ...` | `"default"` | 확인 버튼 variant |
| `closeOnConfirm` | `boolean` | `true` | 확인 후 자동 닫기 |

---

## 삭제 확인 패턴 (가장 일반적)

```tsx
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [itemToDelete, setItemToDelete] = useState<MyItem | null>(null)

// 삭제 버튼 클릭 → 모달 열기
const handleDelete = (row: { original: MyItem }) => {
  setItemToDelete(row.original)
  setDeleteConfirmOpen(true)
}

// 확인 버튼 → 실제 삭제
const handleConfirmDelete = async () => {
  if (!itemToDelete) return
  try {
    await myService.delete(itemToDelete.id)
    toast.success(t("삭제되었습니다."))
    setItemToDelete(null)
    void refetch()
  } catch {
    toast.error(t("삭제 중 오류가 발생했습니다."))
  }
}

// 모달 닫힐 때 state 초기화
const handleDeleteConfirmOpenChange = (open: boolean) => {
  setDeleteConfirmOpen(open)
  if (!open) setItemToDelete(null)
}
```

```tsx
<ConfirmDialog
  open={deleteConfirmOpen}
  onOpenChange={handleDeleteConfirmOpenChange}
  onConfirm={handleConfirmDelete}
  title={t("{{name}}을(를) 삭제하시겠습니까?", { name: itemToDelete?.title })}
  variant="error"
  confirmButtonName={t("삭제")}
  confirmVariant="destructive"
/>
```

---

## variant 스타일

| variant | 아이콘 색상 | 사용 시점 |
|---------|------------|----------|
| `"default"` | 기본 | 일반 확인 |
| `"info"` | 파란색 | 정보성 확인 |
| `"warning"` | 노란색 | 주의 필요한 작업 |
| `"error"` | 빨간색 | 삭제 등 위험한 작업 |

삭제 확인: `variant="error"` + `confirmVariant="destructive"` 조합 사용.

---

## 비동기 onConfirm

`onConfirm`이 Promise를 반환하면 확인 버튼이 로딩 상태가 됩니다:

```tsx
const handleConfirm = async () => {
  await someAsyncOperation()
  // closeOnConfirm이 true(기본값)이면 작업 후 자동으로 닫힘
}

<ConfirmDialog
  onConfirm={handleConfirm}
  // closeOnConfirm={false}  // 수동으로 닫고 싶을 때
/>
```
