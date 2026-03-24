/**
 * mock-example.ts — MSW 핸들러 파일 예시
 *
 * 실제 파일: src/features/{feature}/mocks/{name}.mock.ts
 *
 * - in-memory 배열(store)로 CRUD 상태 유지
 * - GET(목록) / POST(생성) / PUT(수정) / DELETE(삭제) 4개 핸들러
 * - export const {name}Handlers = [...] 형태로 export
 *
 * 이 파일을 src/mocks/handlers.ts에 import하여 spread
 */

import { http, HttpResponse } from "msw"
import type { PrivacyFilterItem } from "@/features/service/types/privacyFilter.types"

// ─── 초기 목 데이터 ────────────────────────────────────────────
const initialData: PrivacyFilterItem[] = [
  {
    patternId: "PF001",
    patternNm: "주민등록번호",
    patternType: "REGEX",
    patternValue: "\\d{6}-[1-4]\\d{6}",
    actionType: "BLOCK",
    patternDesc: "주민등록번호 패턴 탐지 후 차단",
    useYn: "Y",
    regUserId: "sysadmin",
    regOccurDttm: "2026-01-10T09:00:00Z",
    modUserId: "sysadmin",
    modOccurDttm: "2026-03-10T14:00:00Z",
  },
  {
    patternId: "PF002",
    patternNm: "신용카드번호",
    patternType: "REGEX",
    patternValue: "\\d{4}-\\d{4}-\\d{4}-\\d{4}",
    actionType: "MASK",
    patternDesc: "신용카드번호 마스킹 처리",
    useYn: "Y",
    regUserId: "sysadmin",
    regOccurDttm: "2026-01-10T09:00:00Z",
    modUserId: "sysadmin",
    modOccurDttm: "2026-03-10T14:00:00Z",
  },
  // TODO: 실제 데이터에 맞게 수정
]

// in-memory store (앱 세션 동안 CRUD 상태 유지)
const store: PrivacyFilterItem[] = [...initialData]

export const privacyFilterHandlers = [
  // ─── GET 목록 ────────────────────────────────────────────
  http.get("/api/service/privacy-filter/list", () => {
    return HttpResponse.json<PrivacyFilterItem[]>(store, { status: 200 })
  }),

  // ─── POST 생성 ────────────────────────────────────────────
  http.post("/api/service/privacy-filter/create", async ({ request }) => {
    const body = (await request.json()) as Partial<PrivacyFilterItem>
    const now = new Date().toISOString()
    const newItem: PrivacyFilterItem = {
      // TODO: ID 생성 로직을 실제 ID 필드로 변경
      patternId: body.patternId ?? `PF${String(store.length + 1).padStart(3, "0")}`,
      patternNm: body.patternNm ?? "",
      patternType: (body.patternType as PrivacyFilterItem["patternType"]) ?? "REGEX",
      patternValue: body.patternValue ?? "",
      actionType: (body.actionType as PrivacyFilterItem["actionType"]) ?? "WARN",
      patternDesc: body.patternDesc ?? "",
      useYn: (body.useYn as "Y" | "N") ?? "Y",
      regUserId: "sysadmin",
      regOccurDttm: now,
      modUserId: "sysadmin",
      modOccurDttm: now,
    }
    store.push(newItem)
    return HttpResponse.json<PrivacyFilterItem>(newItem, { status: 201 })
  }),

  // ─── PUT 수정 ─────────────────────────────────────────────
  http.put("/api/service/privacy-filter/update/:id", async ({ request, params }) => {
    const id = params.id as string  // TODO: URL 파라미터명을 실제 ID로 변경
    const body = (await request.json()) as Partial<PrivacyFilterItem>
    // TODO: findIndex 키를 실제 ID 필드로 변경
    const index = store.findIndex(item => item.patternId === id)
    if (index === -1) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 })
    }
    const now = new Date().toISOString()
    store[index] = {
      ...store[index],
      ...body,
      patternId: id,  // TODO: ID 필드명 변경
      modUserId: "sysadmin",
      modOccurDttm: now,
    }
    return HttpResponse.json<PrivacyFilterItem>(store[index], { status: 200 })
  }),

  // ─── DELETE 삭제 ──────────────────────────────────────────
  http.delete("/api/service/privacy-filter/delete/:id", ({ params }) => {
    const id = params.id as string  // TODO: URL 파라미터명 변경
    // TODO: findIndex 키를 실제 ID 필드로 변경
    const index = store.findIndex(item => item.patternId === id)
    if (index === -1) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 })
    }
    store.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ──────────────────────────────────────────────────────────────
// readonly-detail 패턴 — GET 상세 추가
// ──────────────────────────────────────────────────────────────
// http.get("/api/log/access/detail/:reqId", ({ params }) => {
//   const reqId = params.reqId as string
//   const item = store.find(item => item.reqId === reqId) ?? null
//   if (!item) {
//     return HttpResponse.json({ message: "Not found" }, { status: 404 })
//   }
//   return HttpResponse.json(item, { status: 200 })
// }),

// ──────────────────────────────────────────────────────────────
// summary-table 패턴 — GET 요약 추가
// ──────────────────────────────────────────────────────────────
// http.get("/api/log/usage/summary", () => {
//   const totalRequests = store.reduce((sum, item) => sum + item.sessionCount, 0)
//   const totalTokenIn = store.reduce((sum, item) => sum + item.tokenInTotal, 0)
//   const totalTokenOut = store.reduce((sum, item) => sum + item.tokenOutTotal, 0)
//   const estimatedCostTotal = store.reduce((sum, item) => sum + item.estimatedCost, 0)
//   return HttpResponse.json({ totalRequests, totalTokenIn, totalTokenOut, estimatedCostTotal }, { status: 200 })
// }),
