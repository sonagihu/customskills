# DataTable 컴포넌트 가이드

`@/components/Table`의 **DataTable** — shadcn UI Table + TanStack Table 기반 공통 데이터 테이블.
Filter Section → Toolbar → Table → Pagination이 **하나의 카드** 안에 배치됩니다.

---

## Import

```tsx
import { DataTable } from "@/components/Table"
import type { DataTableColumnDef, DataTableProps } from "@/components/Table"
```

---

## 최소 예시

```tsx
type Item = { id: string; name: string; amount: number }

const columns: DataTableColumnDef<Item, unknown>[] = [
  { accessorKey: "name", header: "이름" },
  { accessorKey: "amount", header: "금액" },
]

<DataTable columns={columns} data={data} />
```

---

## 컬럼 정의

### 기본 컬럼

```tsx
{
  accessorKey: "email",
  header: "이메일",
  size: 200,           // 컬럼 너비 px
}
```

### 셀 커스텀 렌더링

```tsx
{
  accessorKey: "amount",
  header: "금액",
  cell: ({ row }) => {
    return <span>{row.original.amount.toLocaleString()}</span>
  },
}
```

### 컬럼 meta — Filter Section + 정렬

| meta 필드 | 설명 |
|-----------|------|
| `filter` | `true`이면 Filter Section에 필터 노출 |
| `filterType` | `"input"` \| `"select"` \| `"date"` \| `"time"` \| `"dateTime"` |
| `filterOptions` | select 타입 시 `{ value, label }[]` |
| `filterLabel` | 필터 라벨 (없으면 header 사용) |
| `filterOrder` | 필터 배치 순서 (숫자 작을수록 앞) |
| `filterWidth` | 필터 항목 너비 (`number`=px, `string`=그대로) |
| `align` | 정렬: `"left"` \| `"center"` \| `"right"` |

**input 필터:**
```tsx
meta: {
  filter: true,
  filterType: "input",
  filterLabel: "이름",
  filterOrder: 0,
  filterWidth: 250,
}
```

**select 필터:**
```tsx
meta: {
  filter: true,
  filterType: "select",
  filterLabel: "상태",
  filterOrder: 1,
  filterOptions: [
    { value: "ACTIVE", label: "활성" },
    { value: "INACTIVE", label: "비활성" },
  ],
}
```

**오른쪽 정렬:**
```tsx
meta: { align: "right" }
```

---

## DataTable Props

| Prop | 타입 | 설명 |
|------|------|------|
| `columns` | `DataTableColumnDef<T, unknown>[]` | 컬럼 정의 |
| `data` | `T[]` | 테이블 데이터 |
| `loading` | `boolean` | 로딩 상태 |
| `getRowId` | `(row: T, index?: number) => string` | 행 고유 ID |
| `onRowClick` | `(row: { original: T }) => void` | 행 클릭 핸들러 |
| `onRefresh` | `() => void` | 새로고침 버튼 클릭 시 |
| `toolbar` | `{ searchPlaceholder?, rightButtons? }` | 툴바 설정 |
| `renderActionsCell` | `(row: { original: T }) => ReactNode` | 액션 컬럼 렌더러 |
| `options` | `TableOptions` | 페이지네이션, 체크박스 등 |
| `initialColumnFilters` | `ColumnFilter[]` | 초기 컬럼 필터 상태 |
| `editable` | `EditableOptions<T>` | 인라인 편집 (crud-nested 패턴) |
| `emptyMessage` | `string` | 데이터 없을 때 메시지 |

---

## options

```tsx
options={{
  pagination: {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
  checkable: true,       // 행 선택 체크박스
  sortable: true,        // 컬럼 정렬 (기본 true)
  resizable: true,       // 컬럼 너비 리사이즈
  expandable: {          // 행 펼치기
    renderSubComponent: (row) => <div>{row.original.detail}</div>,
    showExpandAll: true,
  },
  globalFilterColumnIds: ["name", "email"],  // 검색 대상 컬럼
}}
```

---

## toolbar

```tsx
toolbar={{
  searchPlaceholder: "검색...",
  rightButtons: [
    <Button key="add" size="sm" onClick={handleCreate}>
      <PlusIcon className="size-4" />
      추가
    </Button>,
    <Button key="csv" variant="outline" size="sm" onClick={handleCsvDownload}>
      <Download className="mr-1 size-4" />
      CSV 다운로드
    </Button>,
  ],
}}
```

---

## renderActionsCell — DropdownMenu 행 액션

```tsx
renderActionsCell={row => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={e => e.stopPropagation()}  // 행 클릭 이벤트 버블링 방지
      >
        <MoreVertical className="size-4" aria-label="행 액션" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
      <DropdownMenuItem onClick={() => handleEdit(row)}>
        <Pencil className="mr-2 size-4" />
        수정
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleDelete(row)}
        className="text-red-500 focus:text-red-500"
      >
        <Trash2 className="mr-2 size-4 text-red-500" />
        삭제
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

---

## editable — 인라인 편집 (crud-nested 패턴)

컬럼에 `meta.editable`을 설정하고, DataTable에 `editable` prop을 전달합니다.

### 편집 가능 컬럼 meta

| meta 필드 | 설명 |
|-----------|------|
| `editable` | `true`로 설정 |
| `editorType` | `"text"` \| `"number"` \| `"select"` \| `"checkbox"` |
| `editorRequired` | 필수 여부 |
| `editorMaxLength` | text 타입 최대 길이 |
| `editorMin` / `editorMax` | number 타입 범위 |
| `editorOptions` | select 타입 옵션 `{ value, label }[]` |

```tsx
{
  accessorKey: "langCd",
  header: "언어",
  meta: {
    editable: true,
    editorType: "select",
    editorRequired: true,
    editorOptions: [
      { value: "KO", label: "한국어" },
      { value: "EN", label: "영어" },
    ],
  },
}
```

### editable prop

```tsx
editable={{
  createRowFactory: (): ChildItem => ({
    // 새 행 초기값
    langCd: "",
    value: "",
    seq: 0,
    useYn: "Y",
  }),
  onAdd: (newRow: ChildItem) => {
    // 부모 state 업데이트 + setDetailDirty(true)
    setSelectedItem(prev => ({
      ...prev!,
      childList: [...prev!.childList, newRow],
    }))
    setDetailDirty(true)
  },
  onUpdate: (newRow: ChildItem, oldRow: ChildItem) => {
    setSelectedItem(prev => ({
      ...prev!,
      childList: prev!.childList.map(r =>
        r.id === oldRow.id ? newRow : r
      ),
    }))
    setDetailDirty(true)
  },
  onDelete: (targetRow: ChildItem) => {
    setSelectedItem(prev => ({
      ...prev!,
      childList: prev!.childList.filter(r => r.id !== targetRow.id),
    }))
    setDetailDirty(true)
  },
  validateRow: (row: ChildItem) => {
    const errors: { field: string; message: string }[] = []
    if (!row.value) errors.push({ field: "value", message: "값을 입력해 주세요." })
    return errors
  },
}}
```

---

## initialColumnFilters

대시보드 등 다른 화면에서 네비게이션 시 초기 필터 설정:

```tsx
// 네비게이션 쪽:
navigate("/MNC0071", { state: { showBlocked: true } })

// AccessLogPage 쪽:
const location = useLocation()
const showBlocked = (location.state as { showBlocked?: boolean } | null)?.showBlocked

<DataTable
  initialColumnFilters={
    showBlocked ? [{ id: "accessStatus", value: "__blocked__" }] : undefined
  }
/>
```

---

## checkable — 체크박스 선택

```tsx
const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

const selectedRows = useMemo(
  () => data.filter(row => rowSelection[row.id] === true),
  [data, rowSelection]
)

<DataTable
  options={{ checkable: true }}
  getRowId={row => row.id}
  rowSelection={rowSelection}
  onRowSelectionChange={setRowSelection}
/>
```
