/**
 * summary-table 패턴 템플릿
 *
 * 패턴: 요약 Card 4개 + 읽기 전용 DataTable + CSV 다운로드
 * 참조: bwg-admin-kit/src/features/log/pages/UsageLogPage.tsx
 *
 * 사용 시 치환:
 * - {Name} → PascalCase 이름 (예: UsageLog)
 * - {name} → camelCase 이름 (예: usageLog)
 * - {idExpr} → getRowId 표현식 (예: `${row.date}-${row.userId}`)
 * - {feature} → feature 디렉토리명 (예: log)
 * - {csvFileName} → CSV 파일명 (예: usage_log.csv)
 */

import { useQuery } from "@tanstack/react-query"
import { DataTable, type DataTableColumnDef } from "@/components/Table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAppToast } from "@/hooks/useAppToast"
import { Download } from "lucide-react"
import { {name}Service } from "../services/{name}Service"
import type { {Name}Item } from "../types/{name}.types"

export function {Name}Page() {
  const toast = useAppToast()

  // ─── 목록 조회 ────────────────────────────────────────────
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["{feature}", "{name}"],
    queryFn: () => {name}Service.getList(),
  })

  // ─── 요약 조회 ────────────────────────────────────────────
  const { data: summary } = useQuery({
    queryKey: ["{feature}", "{name}", "summary"],
    queryFn: () => {name}Service.getSummary(),
  })

  // ─── 컬럼 정의 ────────────────────────────────────────────
  const columns: DataTableColumnDef<{Name}Item, unknown>[] = [
    // TODO: 컬럼 정의
    // 예시:
    // {
    //   accessorKey: "date",
    //   header: "날짜",
    //   size: 120,
    // },
    // {
    //   accessorKey: "userId",
    //   header: "사용자 ID",
    //   size: 140,
    //   meta: { filter: true, filterType: "input", filterLabel: "사용자 ID", filterOrder: 0 },
    // },
    // 숫자 컬럼 (오른쪽 정렬 + 포맷팅):
    // {
    //   accessorKey: "count",
    //   header: "건수",
    //   size: 80,
    //   meta: { align: "right" },
    //   cell: ({ row }) => <span>{row.original.count.toLocaleString()}</span>,
    // },
    // 비용 컬럼:
    // {
    //   accessorKey: "cost",
    //   header: "비용($)",
    //   size: 100,
    //   meta: { align: "right" },
    //   cell: ({ row }) => <span>${row.original.cost.toFixed(2)}</span>,
    // },
  ]

  // ─── CSV 다운로드 ──────────────────────────────────────────
  const handleCsvDownload = () => {
    try {
      // TODO: header 필드 목록을 실제 필드로 교체
      const header: (keyof {Name}Item)[] = [
        // "date", "userId", "count", ...
      ]
      const rows = items.map(item =>
        header
          .map(key => {
            const val = item[key]
            const str = String(val ?? "")
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          })
          .join(",")
      )
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

  // ─── 렌더 ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* 요약 카드 — 4개, @container/card 반응형 */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

        {/* 카드 1 */}
        <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardDescription>TODO: 카드 제목 1</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {/* TODO: summary 필드 */}
              {summary?.total1.toLocaleString() ?? "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">TODO: 부연 설명</p>
          </CardContent>
        </Card>

        {/* 카드 2 */}
        <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardDescription>TODO: 카드 제목 2</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {summary?.total2.toLocaleString() ?? "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">TODO: 부연 설명</p>
          </CardContent>
        </Card>

        {/* 카드 3 */}
        <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardDescription>TODO: 카드 제목 3</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {summary?.total3.toLocaleString() ?? "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">TODO: 부연 설명</p>
          </CardContent>
        </Card>

        {/* 카드 4 */}
        <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardDescription>TODO: 카드 제목 4</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {summary ? `${summary.total4}` : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">TODO: 부연 설명</p>
          </CardContent>
        </Card>
      </div>

      {/* 데이터 테이블 */}
      <DataTable<{Name}Item>
        columns={columns}
        data={items}
        loading={isLoading}
        getRowId={(row, index) => `{idExpr}-${index}`}
        onRefresh={() => refetch()}
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
    </div>
  )
}

export default {Name}Page
