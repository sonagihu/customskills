/**
 * readonly-detail 패턴 템플릿
 *
 * 패턴: 읽기 전용 DataTable + 행 클릭 시 shadcn Dialog 상세 조회
 * 참조: admin-kit/src/features/log/pages/AccessLogPage.tsx
 *
 * 사용 시 치환:
 * - {Name} → PascalCase 이름 (예: AccessLog)
 * - {name} → camelCase 이름 (예: accessLog)
 * - {idField} → 고유 ID 필드명 (예: reqId)
 * - {feature} → feature 디렉토리명 (예: log)
 * - {csvFileName} → CSV 다운로드 파일명 (예: access_log.csv)
 */

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation } from "react-router"
import { DataTable, type DataTableColumnDef } from "@/components/Table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useAppToast } from "@/hooks/useAppToast"
import { formatDateTime } from "@/utils/date"
import { Download } from "lucide-react"
import { {name}Service } from "../services/{name}Service"
import type { {Name}Item } from "../types/{name}.types"

// ─── 뱃지 컴포넌트 (선택적) ──────────────────────────────────
// 상태값에 따라 색상 다른 Badge를 표시할 때 사용
function StatusBadge({ status }: { status: string }) {
  if (status === "정상" || status === "SUCCESS") {
    return <Badge className="bg-green-600 text-white hover:bg-green-600/80">{status}</Badge>
  }
  if (status === "경고" || status === "WARNING") {
    return <Badge className="bg-amber-500 text-white hover:bg-amber-500/80">{status}</Badge>
  }
  return <Badge className="bg-red-600 text-white hover:bg-red-600/80">{status}</Badge>
}

export function {Name}Page() {
  const toast = useAppToast()

  // useLocation state로 초기 필터 설정 (대시보드 등에서 네비게이션 시 활용)
  const location = useLocation()
  const initialFilter = (location.state as { filter?: string } | null)?.filter

  // ─── 데이터 조회 ────────────────────────────────────────────
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["{feature}", "{name}"],
    queryFn: () => {name}Service.getList(),
  })

  // ─── Dialog 상태 ─────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 행 클릭 시 on-demand fetch (detailOpen && selectedId 조건)
  const {
    data: detail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ["{feature}", "{name}", "detail", selectedId],
    queryFn: () => {name}Service.getDetail(selectedId!),
    enabled: detailOpen && selectedId != null,
  })

  // ─── 컬럼 정의 ──────────────────────────────────────────────
  const columns: DataTableColumnDef<{Name}Item, unknown>[] = [
    // TODO: 컬럼 정의
    // 예시:
    // {
    //   accessorKey: "ts",
    //   header: "시각",
    //   size: 160,
    //   cell: ({ row }) => <span>{formatDateTime(row.original.ts)}</span>,
    // },
    // {
    //   accessorKey: "userId",
    //   header: "사용자",
    //   size: 130,
    //   meta: { filter: true, filterType: "input", filterLabel: "사용자", filterOrder: 0 },
    // },
    // {
    //   accessorKey: "status",
    //   header: "상태",
    //   size: 100,
    //   cell: ({ row }) => <StatusBadge status={row.original.status} />,
    //   meta: {
    //     filter: true,
    //     filterType: "select",
    //     filterLabel: "상태",
    //     filterOrder: 1,
    //     filterOptions: [
    //       { value: "정상", label: "정상" },
    //       { value: "경고", label: "경고" },
    //       { value: "오류", label: "오류" },
    //     ],
    //   },
    // },
  ]

  // ─── 이벤트 핸들러 ───────────────────────────────────────────
  const handleRowClick = (row: { original: {Name}Item }) => {
    setSelectedId(row.original.{idField})
    setDetailOpen(true)
  }

  const handleCsvDownload = () => {
    try {
      // TODO: header 필드 목록을 실제 필드로 교체
      const header = ["{idField}", /* ...다른 필드들 */]
      const rows = items.map(item => {
        const values = item as Record<string, unknown>
        return header
          .map(key => {
            const str = String(values[key] ?? "")
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          })
          .join(",")
      })
      const csv = [header.join(","), ...rows].join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "{csvFileName}"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV 파일이 다운로드되었습니다.")
    } catch {
      toast.error("CSV 다운로드 중 오류가 발생했습니다.")
    }
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
        // initialFilter가 있으면 초기 컬럼 필터 적용 (대시보드 링크에서 넘어올 때)
        initialColumnFilters={initialFilter ? [{ id: "status", value: initialFilter }] : undefined}
        options={{
          pagination: { pageSize: 20, pageSizeOptions: [10, 20, 50] },
        }}
        toolbar={{
          rightButtons: [
            <Button
              key="csv"
              variant="outline"
              size="sm"
              onClick={handleCsvDownload}
            >
              <Download className="mr-1 size-4" />
              CSV 다운로드
            </Button>,
          ],
        }}
      />

      {/* 행 상세 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>상세 정보 ({selectedId})</DialogTitle>
            <DialogDescription>항목 상세 정보</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
          ) : detail ? (
            <div className="space-y-4">
              {/* TODO: 상세 정보 렌더링 */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* 예시:
                <div>
                  <span className="font-medium">시각:</span>{" "}
                  {formatDateTime(detail.ts)}
                </div>
                <div>
                  <span className="font-medium">사용자:</span> {detail.userId}
                </div>
                */}
              </div>
              {/* 페이로드, 기타 큰 내용:
              <div>
                <h4 className="mb-1 text-sm font-medium">내용</h4>
                <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {detail.content}
                </pre>
              </div>
              */}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default {Name}Page
