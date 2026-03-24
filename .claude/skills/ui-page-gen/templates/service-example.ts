/**
 * service-example.ts — Axios 서비스 파일 예시
 *
 * 실제 파일: src/features/{feature}/services/{name}Service.ts
 *
 * CRUD 패턴용 (crud-basic, crud-nested):
 * - getList, create, update, delete
 *
 * Readonly 패턴용 (readonly-detail):
 * - getList, getDetail
 *
 * Summary 패턴용 (summary-table):
 * - getList, getSummary
 */

import axios from "@/lib/axios"
import type { PrivacyFilterItem } from "../types/privacyFilter.types"

// ──────────────────────────────────────────────────────────────
// CRUD 패턴 (crud-basic, crud-nested)
// ──────────────────────────────────────────────────────────────
export const privacyFilterService = {
  async getList(): Promise<PrivacyFilterItem[]> {
    const response = await axios.get<PrivacyFilterItem[]>(
      "/api/service/privacy-filter/list"
    )
    return response.data
  },

  async create(
    payload: Partial<PrivacyFilterItem>
  ): Promise<PrivacyFilterItem> {
    const response = await axios.post<PrivacyFilterItem>(
      "/api/service/privacy-filter/create",
      payload
    )
    return response.data
  },

  async update(
    id: string,
    payload: Partial<PrivacyFilterItem>
  ): Promise<PrivacyFilterItem> {
    const response = await axios.put<PrivacyFilterItem>(
      `/api/service/privacy-filter/update/${id}`,
      payload
    )
    return response.data
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`/api/service/privacy-filter/delete/${id}`)
  },
}

// ──────────────────────────────────────────────────────────────
// readonly-detail 패턴 — getDetail 추가
// ──────────────────────────────────────────────────────────────
// export const accessLogService = {
//   async getList(): Promise<AccessLogItem[]> {
//     const response = await axios.get<AccessLogItem[]>("/api/log/access/list")
//     return response.data
//   },
//
//   async getDetail(reqId: string): Promise<AccessLogItem> {
//     const response = await axios.get<AccessLogItem>(
//       `/api/log/access/detail/${reqId}`
//     )
//     return response.data
//   },
// }

// ──────────────────────────────────────────────────────────────
// summary-table 패턴 — getSummary 추가
// ──────────────────────────────────────────────────────────────
// export type UsageSummary = {
//   totalRequests: number
//   totalTokenIn: number
//   totalTokenOut: number
//   estimatedCostTotal: number
// }
//
// export const usageLogService = {
//   async getList(): Promise<UsageLogItem[]> {
//     const response = await axios.get<UsageLogItem[]>("/api/log/usage/list")
//     return response.data
//   },
//
//   async getSummary(): Promise<UsageSummary> {
//     const response = await axios.get<UsageSummary>("/api/log/usage/summary")
//     return response.data
//   },
// }
