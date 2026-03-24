# DetailSheet 컴포넌트 가이드

`@/components/DetailSheet` — 화면 오른쪽에서 슬라이드 인되는 패널 컴포넌트.
폼 입력, 미저장 변경 감지, headerActions(저장 버튼) 지원.

---

## Import

```tsx
import { DetailSheet, DetailSheetForm } from "@/components/DetailSheet"
import type { DetailSheetFormField } from "@/components/DetailSheet/DetailSheetForm/types"
```

---

## DetailSheet Props

| Prop | 타입 | 설명 |
|------|------|------|
| `open` | `boolean` | 패널 열림 여부 |
| `onOpenChange` | `(open: boolean) => void` | 열림/닫힘 상태 변경 |
| `title` | `string` | 패널 제목 |
| `unsavedChanges` | `{ isDirty: boolean }` | 미저장 변경 여부 — 닫으려 할 때 확인 Dialog 표시 |
| `headerActions` | `ReactNode` | 헤더 오른쪽 액션 (저장 버튼 등) |
| `children` | `ReactNode` | 패널 본문 |

---

## DetailSheetForm Props

| Prop | 타입 | 설명 |
|------|------|------|
| `fields` | `DetailSheetFormField[]` | 폼 필드 정의 |
| `values` | `Record<string, unknown>` | 현재 폼 값 |
| `onChange` | `(name: string, value: unknown) => void` | 값 변경 핸들러 |
| `errors` | `Record<string, string>` | 필드별 에러 메시지 |

---

## 폼 필드 타입 (DetailSheetFormField)

### `"input"` — 텍스트 입력

```tsx
{
  type: "input",
  name: "title",
  label: "제목",
  required: true,       // 필수 여부 (빨간 * 표시)
  span: 5,              // 그리드 span (1~5, 기본 5)
  disabled: isEdit,     // 비활성화 (수정 모드에서 ID 필드 등)
  placeholder: "입력...",
}
```

### `"textarea"` — 여러 줄 텍스트

```tsx
{
  type: "textarea",
  name: "description",
  label: "설명",
  span: 5,
}
```

### `"select"` — 드롭다운 선택

```tsx
{
  type: "select",
  name: "status",
  label: "상태",
  span: 5,
  options: [
    { label: "활성", value: "ACTIVE" },
    { label: "비활성", value: "INACTIVE" },
  ],
}
```

### `"switch"` — 토글 스위치

```tsx
{
  type: "switch",
  name: "useYn",
  label: "사용 여부",
  checkedValue: "Y",    // checked 상태일 때의 값 (string 타입 "Y"/"N" 사용)
  span: 5,
  layout: "column",     // "row" | "column", 기본 "row"
}
```

### `"readonly"` — 읽기 전용 표시

```tsx
{
  type: "readonly",
  name: "regUserId",
  label: "등록 사용자",
  span: 2,              // span 2: 2컬럼 레이아웃에서 절반 크기
  format: (v) => formatDateTime(v as string),  // 값 포맷 함수 (선택적)
}
```

---

## span 레이아웃 시스템

- 5컬럼 그리드 사용
- `span: 5` = 전체 너비 (기본값, 단일 컬럼)
- `span: 2` = 절반 (2컬럼 레이아웃에서 2개 나란히)
- `span: 1` = 가장 좁음

실제 사용 패턴:
- 일반 폼 필드 → `span: 5`
- 감사 정보 (등록일시/수정일시) → `span: 2` (2개 나란히)

---

## 기본 사용 패턴 (crud-basic)

```tsx
const [detailOpen, setDetailOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<MyItem | null>(null)
const isEdit = selectedItem != null && !!selectedItem.id

// React Hook Form 설정
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: INIT_DATA as unknown as FormValues,
})
const { control, setValue, reset, getValues, handleSubmit, formState } = form
const formValues = (useWatch({ control }) ?? {}) as Record<string, unknown>
const [initialFormValues, setInitialFormValues] = useState<FormValues | null>(null)

// 패널 열릴 때 폼 초기화
useEffect(() => {
  if (detailOpen) {
    const initial = (selectedItem ?? INIT_DATA) as unknown as FormValues
    reset(initial)
    setInitialFormValues({ ...initial })
  } else {
    setInitialFormValues(null)
  }
}, [detailOpen, selectedItem?.id, reset])

// 미저장 변경 감지 (JSON 비교)
const hasUnsavedChanges =
  initialFormValues != null &&
  JSON.stringify(getValues()) !== JSON.stringify(initialFormValues)

// 에러 맵 변환
const formErrorsMap: Record<string, string> = {}
for (const [key, err] of Object.entries(formState.errors)) {
  const message = err?.message
  if (typeof message === "string") formErrorsMap[key] = t(message)
}

// 폼 onChange 핸들러
const handleFormChange = (name: string, value: unknown) => {
  setValue(name as keyof FormValues, value, { shouldValidate: true })
}

// DetailSheet onOpenChange
const handleDetailOpenChange = (open: boolean) => {
  setDetailOpen(open)
  if (!open) {
    setSelectedItem(null)
    setInitialFormValues(null)
  }
}
```

```tsx
<DetailSheet
  open={detailOpen}
  onOpenChange={handleDetailOpenChange}
  unsavedChanges={{ isDirty: hasUnsavedChanges }}
  title={isEdit ? (selectedItem?.title ?? "상세") : "추가"}
  headerActions={
    <Button
      size="sm"
      onClick={() => void handleSubmit(onValidSubmit, onInvalidSubmit)()}
    >
      저장
    </Button>
  }
>
  <DetailSheetForm
    fields={formFields}
    values={formValues as Record<string, unknown>}
    onChange={handleFormChange}
    errors={formErrorsMap}
  />
</DetailSheet>
```

---

## 감사 정보 필드 패턴 (수정 모드만 표시)

```tsx
// 기본 폼 필드 (항상 표시)
const baseFormFields: DetailSheetFormField[] = [
  { type: "input", name: "title", label: t("제목"), required: true, span: 5 },
  // ...
]

// 감사 정보 (수정 모드에서만 표시)
const readonlyFormFields: DetailSheetFormField[] = [
  { type: "readonly", name: "regUserId", label: t("등록 사용자 ID"), span: 2 },
  { type: "readonly", name: "regOccurDttm", label: t("등록 일시"), span: 2, format: v => formatDateTime(v as string) },
  { type: "readonly", name: "modUserId", label: t("수정 사용자 ID"), span: 2 },
  { type: "readonly", name: "modOccurDttm", label: t("수정 일시"), span: 2, format: v => formatDateTime(v as string) },
]

// 수정 모드에서 ID 필드 비활성화 + 감사 정보 추가
const formFields = !isEdit
  ? baseFormFields
  : [
      ...baseFormFields.map(f =>
        f.name === "id" ? { ...f, disabled: true as const } : f
      ),
      ...readonlyFormFields,
    ]
```

---

## Zod 스키마 + React Hook Form 패턴

```typescript
const myFormSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "제목을 입력해 주세요."),
    type: z.enum(["TYPE_A", "TYPE_B"]),
    description: z.string().optional(),
    useYn: z.enum(["Y", "N"]),
  })
  .loose()  // 스키마에 없는 필드 허용 (감사 정보 등)

type MyFormValues = z.infer<typeof myFormSchema>
```

---

## crud-nested 패턴: detailDirty 추적

```tsx
const [detailDirty, setDetailDirty] = useState(false)

// useEffect에서 초기화
useEffect(() => {
  if (detailOpen) {
    // ...
    setDetailDirty(false)
  } else {
    setDetailDirty(false)
  }
}, [detailOpen, selectedItem?.id, reset])

// formDirty와 detailDirty 합산
const formDirty = initialFormValues != null &&
  JSON.stringify(getValues()) !== JSON.stringify(initialFormValues)
const hasUnsavedChanges = formDirty || detailDirty

// 자식 테이블 변경 시 setDetailDirty(true) 호출
```
