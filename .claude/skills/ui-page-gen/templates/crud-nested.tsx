/**
 * crud-nested 패턴 템플릿
 *
 * 패턴: DataTable + DetailSheet (안에 편집 가능한 중첩 DataTable 포함)
 * 참조: admin-kit/src/features/config/pages/CodeManagementPage.tsx
 *
 * 사용 시 치환:
 * - {Name} → PascalCase 이름 (예: Code)
 * - {name} → camelCase 이름 (예: code)
 * - {idField} → 부모 고유 ID (예: cdId)
 * - {nameField} → 부모 표시 이름 (예: cdNm)
 * - {ChildItem} → 자식 타입명 (예: CodeDetailItem)
 * - {childIdComposite} → 자식 행 고유 식별 표현식 (예: `${row.cdVal}-${row.langCd}`)
 * - {feature} → feature 디렉토리명 (예: config)
 */

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { MoreVertical, Pencil, PlusIcon, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DataTable } from "@/components/Table"
import type { DataTableColumnDef } from "@/components/Table/types"
import { DetailSheet, DetailSheetForm } from "@/components/DetailSheet"
import type { DetailSheetFormField } from "@/components/DetailSheet/DetailSheetForm/types"
import { Button } from "@/components/ui/button"
import { useAppToast } from "@/hooks/useAppToast"
import { {name}Service } from "@/features/{feature}/services/{name}Service"
import type { {Name}Item, {ChildItem} } from "@/features/{feature}/types/{name}.types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { formatDateTime } from "@/utils/date"

// ─── Zod 스키마 ───────────────────────────────────────────────
const {name}FormSchema = z
  .object({
    {idField}: z.string().min(1, "ID를 입력해 주세요."),
    {nameField}: z.string().min(1, "이름을 입력해 주세요."),
    // TODO: 추가 필드
  })
  .loose()

type {Name}FormValues = z.infer<typeof {name}FormSchema>

// ─── 초기 데이터 ──────────────────────────────────────────────
const INIT_DATA: {Name}Item = {
  {idField}: "",
  {nameField}: "",
  childList: [],  // TODO: 자식 배열 필드명으로 변경
}

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

  // ─── 부모 테이블 컬럼 ────────────────────────────────────────
  const columns: DataTableColumnDef<{Name}Item, unknown>[] = [
    {
      accessorKey: "{idField}",
      header: t("ID"),
      size: 150,
      meta: { filter: true, filterType: "input", filterLabel: t("ID"), filterOrder: 0 },
    },
    {
      accessorKey: "{nameField}",
      header: t("이름"),
      size: 200,
      meta: { filter: true, filterWidth: 250, filterType: "input", filterLabel: t("이름"), filterOrder: 1 },
    },
    // TODO: 추가 컬럼
    {
      accessorKey: "modOccurDttm",
      header: t("수정 일시"),
      size: 130,
      cell: ({ row }) => <span>{formatDateTime(row.original.modOccurDttm)}</span>,
    },
  ]

  // ─── 자식(중첩) 테이블 컬럼 — editable ─────────────────────
  const childTableColumns: DataTableColumnDef<{ChildItem}, unknown>[] = [
    // TODO: 자식 필드에 맞게 수정
    // editable 컬럼 예시:
    // {
    //   accessorKey: "langCd",
    //   header: t("언어"),
    //   size: 80,
    //   meta: {
    //     editable: true,
    //     editorType: "select",
    //     editorRequired: true,
    //     editorOptions: [
    //       { value: "EN", label: t("영어") },
    //       { value: "KO", label: t("한국어") },
    //     ],
    //   },
    // },
    // {
    //   accessorKey: "value",
    //   header: t("값"),
    //   size: 130,
    //   meta: { editable: true, editorType: "text", editorRequired: true, editorMaxLength: 30 },
    // },
    // {
    //   accessorKey: "seq",
    //   header: t("순번"),
    //   size: 60,
    //   meta: { editable: true, editorType: "number", editorRequired: true, editorMin: 0 },
    // },
  ]

  // ─── UI 상태 ────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{Name}Item | null>(null)
  const isEdit = selectedItem != null && !!selectedItem.{idField}
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{Name}Item | null>(null)
  const [detailDirty, setDetailDirty] = useState(false) // 중첩 테이블 변경 여부

  // ─── 폼 ─────────────────────────────────────────────────────
  const form = useForm<{Name}FormValues>({
    resolver: zodResolver({name}FormSchema),
    defaultValues: INIT_DATA as unknown as {Name}FormValues,
  })
  const { control, setValue, reset, getValues, handleSubmit, formState } = form
  const formValues = (useWatch({ control }) ?? {}) as Record<string, unknown>
  const [initialFormValues, setInitialFormValues] = useState<{Name}FormValues | null>(null)

  useEffect(() => {
    if (detailOpen) {
      const initial = (selectedItem ?? INIT_DATA) as unknown as {Name}FormValues
      reset(initial)
      setInitialFormValues({ ...initial })
      setDetailDirty(false)
    } else {
      setInitialFormValues(null)
      setDetailDirty(false)
    }
  }, [detailOpen, selectedItem?.{idField}, reset])

  const formDirty =
    initialFormValues != null &&
    JSON.stringify(getValues()) !== JSON.stringify(initialFormValues)
  const hasUnsavedChanges = formDirty || detailDirty

  const formErrorsMap: Record<string, string> = {}
  for (const [key, err] of Object.entries(formState.errors)) {
    const message = err?.message
    if (typeof message === "string") formErrorsMap[key] = t(message)
  }

  // ─── DetailSheet 폼 필드 ─────────────────────────────────────
  const baseFormFields: DetailSheetFormField[] = [
    { type: "input", name: "{idField}", label: t("ID"), required: true, span: 5 },
    { type: "input", name: "{nameField}", label: t("이름"), required: true, span: 5 },
    // TODO: 추가 필드
  ]

  const readonlyFormFields: DetailSheetFormField[] = [
    { type: "readonly", name: "regUserId", label: t("등록 사용자 ID"), span: 2 },
    { type: "readonly", name: "regOccurDttm", label: t("등록 일시"), span: 2, format: v => formatDateTime(v as string) },
    { type: "readonly", name: "modUserId", label: t("수정 사용자 ID"), span: 2 },
    { type: "readonly", name: "modOccurDttm", label: t("수정 일시"), span: 2, format: v => formatDateTime(v as string) },
  ]

  const handleFormChange = (name: string, value: unknown) => {
    setValue(name as keyof {Name}FormValues, value, { shouldValidate: true })
  }

  // ─── 이벤트 핸들러 ───────────────────────────────────────────
  const onValidSubmit = async (data: {Name}FormValues) => {
    try {
      const payload = {
        ...data,
        childList: selectedItem?.childList ?? [],  // TODO: 자식 배열 필드명
      }
      if (isEdit && selectedItem) {
        await {name}Service.update(selectedItem.{idField}, payload)
      } else {
        await {name}Service.create(payload)
      }
      toast.success(t(isEdit ? "수정되었습니다." : "저장되었습니다."))
      void refetch()
    } catch {
      toast.error(t("저장 중 오류가 발생했습니다."))
    } finally {
      setDetailDirty(false)
      setDetailOpen(false)
      setSelectedItem(null)
    }
  }

  const onInvalidSubmit = () => {
    toast.warning(t("필수 항목이 누락되었습니다. 입력값을 확인해 주세요."))
  }

  const handleCreate = () => { setSelectedItem({ ...INIT_DATA }); setDetailOpen(true) }
  const handleRowClick = (row: { original: {Name}Item }) => { setSelectedItem(row.original); setDetailOpen(true) }
  const handleEdit = (row: { original: {Name}Item }) => { setSelectedItem(row.original); setDetailOpen(true) }
  const handleDelete = (row: { original: {Name}Item }) => { setItemToDelete(row.original); setDeleteConfirmOpen(true) }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await {name}Service.delete(itemToDelete.{idField})
      toast.success(t("삭제되었습니다."))
      void refetch()
    } catch {
      toast.error(t("삭제 중 오류가 발생했습니다."))
    } finally {
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open)
    if (!open) { setSelectedItem(null); setInitialFormValues(null); setDetailDirty(false) }
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
        options={{ pagination: { pageSize: 10, pageSizeOptions: [10, 20, 50] } }}
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
              <Button variant="ghost" size="icon" className="size-8" onClick={e => e.stopPropagation()}>
                <MoreVertical className="size-4" aria-label="행 액션" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => handleEdit(row)}>
                <Pencil className="mr-2 size-4" />{t("수정")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(row)} className="text-red-500 focus:text-red-500">
                <Trash2 className="mr-2 size-4 text-red-500" />{t("삭제")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <DetailSheet
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        unsavedChanges={{ isDirty: hasUnsavedChanges }}
        title={isEdit ? (selectedItem?.{idField} ?? t("{Name} 상세")) : t("{Name} 추가")}
        headerActions={
          <Button size="sm" onClick={() => void handleSubmit(onValidSubmit, onInvalidSubmit)()}>
            {t("저장")}
          </Button>
        }
      >
        {/* 부모 폼 */}
        <DetailSheetForm
          fields={baseFormFields}
          values={formValues as Record<string, unknown>}
          onChange={handleFormChange}
          errors={formErrorsMap}
        />

        {/* 중첩 편집 테이블 */}
        <div className="my-6">
          <DataTable<{ChildItem}>
            columns={childTableColumns}
            data={selectedItem?.childList ?? []}  // TODO: 자식 배열 필드명
            options={{ sortable: true }}
            toolbar={{ searchPlaceholder: t("검색...") }}
            editable={{
              // TODO: 자식 아이템 초기값으로 수정
              createRowFactory: (): {ChildItem} => ({
                // ... 자식 필드 초기값
              }),
              onAdd: (newRow: {ChildItem}) => {
                setSelectedItem(prev => {
                  if (!prev) return null
                  return { ...prev, childList: [...prev.childList, newRow] }  // TODO: 자식 배열 필드명
                })
                setDetailDirty(true)
              },
              onUpdate: (newRow: {ChildItem}, oldRow: {ChildItem}) => {
                setSelectedItem(prev => {
                  if (!prev) return null
                  return {
                    ...prev,
                    childList: prev.childList.map(row =>  // TODO: 자식 배열 필드명
                      {childIdComposite(row)} === {childIdComposite(oldRow)} ? newRow : row
                    ),
                  }
                })
                setDetailDirty(true)
              },
              onDelete: (targetRow: {ChildItem}) => {
                setSelectedItem(prev => {
                  if (!prev) return null
                  return {
                    ...prev,
                    childList: prev.childList.filter(  // TODO: 자식 배열 필드명
                      row => {childIdComposite(row)} !== {childIdComposite(targetRow)}
                    ),
                  }
                })
                setDetailDirty(true)
              },
              validateRow: (row: {ChildItem}) => {
                const errors: { field: string; message: string }[] = []
                // TODO: 유효성 검사 추가
                return errors
              },
            }}
            emptyMessage={t("항목을 추가해 주세요.")}
          />
        </div>

        {/* 수정 모드 감사 정보 */}
        {isEdit && (
          <DetailSheetForm
            fields={readonlyFormFields}
            values={formValues as Record<string, unknown>}
            onChange={handleFormChange}
            errors={formErrorsMap}
          />
        )}
      </DetailSheet>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={handleDeleteConfirmOpenChange}
        onConfirm={handleConfirmDelete}
        title={t("삭제하시겠습니까?", { item: itemToDelete?.{idField} })}
        variant="error"
        confirmButtonName={t("삭제")}
        confirmVariant="destructive"
      />
    </>
  )
}
