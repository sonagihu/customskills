/**
 * crud-basic 패턴 템플릿
 *
 * 패턴: DataTable + DetailSheet 슬라이드 패널 (기본 CRUD)
 * 참조: admin-kit/src/features/service/pages/PrivacyFilterPage.tsx
 *
 * 사용 방법:
 * - {Name} → PascalCase 이름 (예: Notice)
 * - {name} → camelCase 이름 (예: notice)
 * - {idField} → 고유 ID 필드명 (예: noticeId)
 * - {nameField} → 표시 이름 필드명 (예: noticeTitle)
 * - {feature} → feature 디렉토리명 (예: config)
 * - {ROUTE} → 라우트 ID (예: MNC0080)
 */

import { DataTable, type DataTableColumnDef } from "@/components/Table"
import type { {Name}Item } from "../types/{name}.types"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, PlusIcon, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import { useAppToast } from "@/hooks/useAppToast"
import { useQuery } from "@tanstack/react-query"
import { {name}Service } from "../services/{name}Service"
import { formatDateTime } from "@/utils/date"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useEffect, useState } from "react"
import type { DetailSheetFormField } from "@/components/DetailSheet/DetailSheetForm/types"
import { DetailSheet, DetailSheetForm } from "@/components/DetailSheet"
import { ConfirmDialog } from "@/components/ConfirmDialog"

// ─── Zod 스키마 ───────────────────────────────────────────────
const {name}FormSchema = z
  .object({
    {idField}: z.string().optional(),
    // TODO: 필드 추가 (z.string().min(1, "..."), z.enum([...]) 등)
    useYn: z.enum(["Y", "N"]),
  })
  .loose()

type {Name}FormValues = z.infer<typeof {name}FormSchema>

// ─── 초기 데이터 ──────────────────────────────────────────────
const INIT_DATA: {Name}Item = {
  {idField}: "",
  // TODO: 필드 초기값
  useYn: "N",
}

// ─── 레이블 맵 (선택적) ──────────────────────────────────────
// const STATUS_LABELS: Record<string, string> = {
//   ACTIVE: "활성",
//   INACTIVE: "비활성",
// }

export function {Name}Page() {
  const { t } = useTranslation()
  const toast = useAppToast()

  // ─── 데이터 조회 ────────────────────────────────────────────
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["{feature}", "{name}", "list"],
    queryFn: () => {name}Service.getList(),
  })

  // ─── 컬럼 정의 ──────────────────────────────────────────────
  const columns: DataTableColumnDef<{Name}Item, unknown>[] = [
    // TODO: 컬럼 정의
    // input 필터 예시:
    // {
    //   accessorKey: "title",
    //   header: t("제목"),
    //   size: 200,
    //   meta: {
    //     filter: true,
    //     filterType: "input",
    //     filterLabel: t("제목"),
    //     filterOrder: 0,
    //     filterWidth: 250,
    //   },
    // },
    // select 필터 예시:
    // {
    //   accessorKey: "status",
    //   header: t("상태"),
    //   size: 100,
    //   meta: {
    //     filter: true,
    //     filterType: "select",
    //     filterLabel: t("상태"),
    //     filterOrder: 1,
    //     filterOptions: [
    //       { label: t("활성"), value: "ACTIVE" },
    //       { label: t("비활성"), value: "INACTIVE" },
    //     ],
    //   },
    // },
    {
      accessorKey: "useYn",
      header: t("사용 여부"),
      size: 80,
      meta: {
        filter: true,
        filterType: "select",
        filterLabel: t("사용 여부"),
        filterOrder: 99,
        filterOptions: [
          { label: t("사용"), value: "Y" },
          { label: t("미사용"), value: "N" },
        ],
      },
    },
    {
      accessorKey: "modOccurDttm",
      header: t("수정 일시"),
      size: 160,
      cell: ({ row }) => <span>{formatDateTime(row.original.modOccurDttm)}</span>,
    },
  ]

  // ─── UI 상태 ────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{Name}Item | null>(null)
  const isEdit = selectedItem != null && !!selectedItem.{idField}
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{Name}Item | null>(null)

  // ─── 폼 ─────────────────────────────────────────────────────
  const form = useForm<{Name}FormValues>({
    resolver: zodResolver({name}FormSchema),
    defaultValues: INIT_DATA as unknown as {Name}FormValues,
  })
  const { control, setValue, reset, getValues, handleSubmit, formState } = form
  const formValues = (useWatch({ control }) ?? {}) as Record<string, unknown>
  const [initialFormValues, setInitialFormValues] = useState<{Name}FormValues | null>(null)

  // DetailSheet 열릴 때 폼 초기화
  useEffect(() => {
    if (detailOpen) {
      const initial = (selectedItem ?? INIT_DATA) as unknown as {Name}FormValues
      reset(initial)
      setInitialFormValues({ ...initial })
    } else {
      setInitialFormValues(null)
    }
  }, [detailOpen, selectedItem?.{idField}, reset])

  // 미저장 변경 감지
  const hasUnsavedChanges =
    initialFormValues != null &&
    JSON.stringify(getValues()) !== JSON.stringify(initialFormValues)

  // 폼 에러 맵
  const formErrorsMap: Record<string, string> = {}
  for (const [key, err] of Object.entries(formState.errors)) {
    const message = err?.message
    if (typeof message === "string") formErrorsMap[key] = t(message)
  }

  // ─── DetailSheet 폼 필드 ─────────────────────────────────────
  const baseFormFields: DetailSheetFormField[] = [
    // TODO: 폼 필드 정의
    // input 예시:
    // { type: "input", name: "{idField}", label: t("ID"), span: 5, disabled: isEdit },
    // { type: "input", name: "title", label: t("제목"), required: true, span: 5 },
    // select 예시:
    // {
    //   type: "select",
    //   name: "status",
    //   label: t("상태"),
    //   span: 5,
    //   options: [
    //     { label: t("활성"), value: "ACTIVE" },
    //     { label: t("비활성"), value: "INACTIVE" },
    //   ],
    // },
    // textarea 예시:
    // { type: "textarea", name: "description", label: t("설명"), span: 5 },
    // switch 예시:
    {
      type: "switch",
      name: "useYn",
      label: t("사용 여부"),
      checkedValue: "Y",
      span: 5,
      layout: "column",
    },
  ]

  // 수정 모드 시 readonly 감사 정보 추가
  const readonlyFormFields: DetailSheetFormField[] = [
    { type: "readonly", name: "regUserId", label: t("등록 사용자 ID"), span: 2 },
    { type: "readonly", name: "regOccurDttm", label: t("등록 일시"), span: 2, format: v => formatDateTime(v as string) },
    { type: "readonly", name: "modUserId", label: t("수정 사용자 ID"), span: 2 },
    { type: "readonly", name: "modOccurDttm", label: t("수정 일시"), span: 2, format: v => formatDateTime(v as string) },
  ]

  const formFields = !isEdit
    ? baseFormFields
    : [
        ...baseFormFields.map(f =>
          f.name === "{idField}" ? { ...f, disabled: true as const } : f
        ),
        ...readonlyFormFields,
      ]

  // ─── 이벤트 핸들러 ───────────────────────────────────────────
  const handleFormChange = (name: string, value: unknown) => {
    setValue(name as keyof {Name}FormValues, value, { shouldValidate: true })
  }

  const onValidSubmit = async (data: {Name}FormValues) => {
    try {
      if (isEdit && selectedItem) {
        await {name}Service.update(selectedItem.{idField}, data)
      } else {
        await {name}Service.create(data)
      }
      toast.success(t(isEdit ? "수정되었습니다." : "저장되었습니다."))
      void refetch()
    } catch {
      toast.error(t("저장 중 오류가 발생했습니다."))
    } finally {
      setDetailOpen(false)
      setSelectedItem(null)
    }
  }

  const onInvalidSubmit = () => {
    toast.warning(t("필수 항목이 누락되었습니다. 입력값을 확인해 주세요."))
  }

  const handleCreate = () => {
    setSelectedItem({ ...INIT_DATA })
    setDetailOpen(true)
  }

  const handleRowClick = (row: { original: {Name}Item }) => {
    setSelectedItem(row.original)
    setDetailOpen(true)
  }

  const handleEdit = (row: { original: {Name}Item }) => {
    setSelectedItem(row.original)
    setDetailOpen(true)
  }

  const handleDelete = (row: { original: {Name}Item }) => {
    setItemToDelete(row.original)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await {name}Service.delete(itemToDelete.{idField})
      toast.success(t("삭제되었습니다."))
      setItemToDelete(null)
      void refetch()
    } catch {
      toast.error(t("삭제 중 오류가 발생했습니다."))
    }
  }

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open)
    if (!open) {
      setSelectedItem(null)
      setInitialFormValues(null)
    }
  }

  const handleDeleteConfirmOpenChange = (open: boolean) => {
    setDeleteConfirmOpen(open)
    if (!open) setItemToDelete(null)
  }

  // ─── 렌더 ───────────────────────────────────────────────────
  return (
    <>
      <DataTable<{Name}Item>
        columns={columns}
        data={items}
        loading={isLoading}
        getRowId={row => row.{idField}}
        onRowClick={handleRowClick}
        onRefresh={() => refetch()}
        options={{
          pagination: { pageSize: 10, pageSizeOptions: [10, 20, 50] },
        }}
        toolbar={{
          rightButtons: [
            <Button key="add" size="sm" onClick={handleCreate}>
              <PlusIcon className="size-4" />
              {t("{Name} 추가")}
            </Button>,
          ],
        }}
        renderActionsCell={row => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="size-4" aria-label="행 액션" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => handleEdit(row)}>
                <Pencil className="mr-2 size-4" />
                {t("수정")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(row)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 size-4 text-red-500" />
                {t("삭제")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <DetailSheet
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        unsavedChanges={{ isDirty: hasUnsavedChanges }}
        title={isEdit ? (selectedItem?.{nameField} ?? t("{Name} 상세")) : t("{Name} 추가")}
        headerActions={
          <Button
            size="sm"
            onClick={() => void handleSubmit(onValidSubmit, onInvalidSubmit)()}
          >
            {t("저장")}
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={handleDeleteConfirmOpenChange}
        onConfirm={handleConfirmDelete}
        title={t("삭제하시겠습니까?", { item: itemToDelete?.{nameField} })}
        variant="error"
        confirmButtonName={t("삭제")}
        confirmVariant="destructive"
      />
    </>
  )
}

export default {Name}Page
