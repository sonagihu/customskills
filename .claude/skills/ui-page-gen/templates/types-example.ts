/**
 * types-example.ts — TypeScript 타입 파일 예시
 *
 * 실제 파일: src/features/{feature}/types/{name}.types.ts
 *
 * 규칙:
 * - interface로 데이터 모델 정의
 * - 선택적 감사 필드(regUserId 등)는 ? 처리
 * - enum 대신 literal union type 사용 (z.enum과 호환)
 */

// ─── CRUD 기본 타입 예시 ──────────────────────────────────────
export interface PrivacyFilterItem {
  patternId: string
  patternNm: string
  patternType: "REGEX" | "KEYWORD"
  patternValue: string
  actionType: "MASK" | "BLOCK" | "WARN"
  patternDesc: string
  useYn: "Y" | "N"
  // 감사 정보 (서버에서 채워짐, 생성 시 불필요)
  regUserId?: string
  regOccurDttm?: string
  modUserId?: string
  modOccurDttm?: string
}

// ─── CRUD 중첩 타입 예시 (부모 + 자식 배열) ─────────────────
// export interface CodeDetailItem {
//   cdId: string
//   langCd: string
//   cdVal: string
//   cdValNm: string
//   cdValDesc: string
//   cdSeq: number
//   useYn: "Y" | "N"
// }
//
// export interface CodeManagementItem {
//   cdId: string
//   cdNm: string
//   cdDesc: string
//   cdDetailList: CodeDetailItem[]   // 자식 배열
//   regUserId?: string
//   regOccurDttm?: string
//   modUserId?: string
//   modOccurDttm?: string
// }

// ─── 읽기 전용 타입 예시 ─────────────────────────────────────
// export interface AccessLogItem {
//   reqId: string
//   ts: string                        // ISO 8601 datetime
//   clientIp: string
//   userId: string
//   service: string
//   route: string
//   method: string
//   status: number
//   latencyMs: number
//   reqBytes: number
//   respBytes: number
//   tokenIn: number
//   tokenOut: number
//   payloadLogged: boolean
//   blockReason?: string
//   // 상세 조회용 (getDetail에서만 반환)
//   reqPayload?: string
//   respPayload?: string
// }

// ─── 요약 타입 예시 ──────────────────────────────────────────
// export interface UsageLogItem {
//   date: string
//   userId: string
//   userNm: string
//   service: string
//   sessionCount: number
//   tokenInTotal: number
//   tokenOutTotal: number
//   estimatedCost: number
// }
//
// export interface UsageSummary {
//   totalRequests: number
//   totalTokenIn: number
//   totalTokenOut: number
//   estimatedCostTotal: number
// }
