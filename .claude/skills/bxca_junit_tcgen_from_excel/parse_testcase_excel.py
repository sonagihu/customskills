#!/usr/bin/env python3
"""
테스트케이스 Excel 파일을 파싱하여 JSON으로 출력하는 스크립트.
bxca_testcase_gen 스킬이 생성한 Excel 포맷을 읽습니다.

사용법: python parse_testcase_excel.py <excel_path>

출력: JSON (stdout)
- 성공 시: {"status": "ok", "test_cases": [...], "summary": {...}}
- 실패 시: {"status": "error", "message": "...", "expected_format": {...}}
"""

import json
import sys
import os


def ensure_openpyxl():
    try:
        import openpyxl
        return openpyxl
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "-q"])
        import openpyxl
        return openpyxl


EXPECTED_HEADERS_8COL = [
    "No",
    "테스트케이스ID\n(소스파일명)",
    "테스트케이스명",
    "테스트내용",
    "테스트조건",
    "예상결과",
    "중요도",
    "테스트결과",
]

EXPECTED_HEADERS_7COL = [
    "No",
    "테스트케이스ID\n(소스파일명)",
    "테스트케이스명",
    "테스트내용",
    "테스트조건",
    "예상결과",
    "테스트결과",
]

EXPECTED_FORMAT_DESC = {
    "description": "bxca_testcase_gen 스킬이 생성한 테스트케이스 Excel 파일",
    "required_sheet": "테스트케이스_자동생성",
    "columns_8col": EXPECTED_HEADERS_8COL,
    "columns_7col": EXPECTED_HEADERS_7COL,
    "note": "첫 번째 행이 헤더, 두 번째 행부터 데이터. '요약' 시트는 선택사항.",
}


def normalize_header(val):
    """셀 값을 정규화하여 비교."""
    if val is None:
        return ""
    return str(val).strip().replace("\r\n", "\n").replace("\r", "\n")


def parse_excel(excel_path):
    openpyxl = ensure_openpyxl()

    if not os.path.exists(excel_path):
        return {
            "status": "error",
            "message": f"파일을 찾을 수 없습니다: {excel_path}",
            "expected_format": EXPECTED_FORMAT_DESC,
        }

    try:
        wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Excel 파일을 열 수 없습니다: {e}",
            "expected_format": EXPECTED_FORMAT_DESC,
        }

    # 시트 찾기
    target_sheet = None
    for name in wb.sheetnames:
        if "테스트케이스" in name and "요약" not in name:
            target_sheet = wb[name]
            break

    if target_sheet is None:
        return {
            "status": "error",
            "message": f"'테스트케이스' 관련 시트를 찾을 수 없습니다. 시트 목록: {wb.sheetnames}",
            "expected_format": EXPECTED_FORMAT_DESC,
        }

    # 헤더 검증
    rows = list(target_sheet.iter_rows(min_row=1, max_row=1, values_only=True))
    if not rows:
        return {
            "status": "error",
            "message": "시트에 데이터가 없습니다.",
            "expected_format": EXPECTED_FORMAT_DESC,
        }

    raw_headers = [normalize_header(h) for h in rows[0] if h is not None]

    # 8컬럼(중요도 포함) 또는 7컬럼(중요도 미포함) 포맷 판별
    has_priority = False
    if len(raw_headers) >= 8:
        expected = [normalize_header(h) for h in EXPECTED_HEADERS_8COL]
        if raw_headers[:8] == expected:
            has_priority = True
        else:
            # 7컬럼도 체크
            expected7 = [normalize_header(h) for h in EXPECTED_HEADERS_7COL]
            if raw_headers[:7] != expected7:
                return {
                    "status": "error",
                    "message": f"헤더가 예상 포맷과 다릅니다.\n실제 헤더: {raw_headers[:8]}\n예상 헤더(8열): {expected}",
                    "expected_format": EXPECTED_FORMAT_DESC,
                }
    elif len(raw_headers) >= 7:
        expected7 = [normalize_header(h) for h in EXPECTED_HEADERS_7COL]
        if raw_headers[:7] != expected7:
            return {
                "status": "error",
                "message": f"헤더가 예상 포맷과 다릅니다.\n실제 헤더: {raw_headers[:7]}\n예상 헤더(7열): {expected7}",
                "expected_format": EXPECTED_FORMAT_DESC,
            }
    else:
        return {
            "status": "error",
            "message": f"컬럼 수가 부족합니다. 최소 7열 필요, 현재 {len(raw_headers)}열.",
            "expected_format": EXPECTED_FORMAT_DESC,
        }

    # 데이터 파싱
    test_cases = []
    for row in target_sheet.iter_rows(min_row=2, values_only=True):
        # 빈 행 건너뛰기
        if row[0] is None and row[1] is None:
            continue

        tc = {
            "no": row[0],
            "source_file": str(row[1] or "").strip(),
            "test_name": str(row[2] or "").strip(),
            "test_content": str(row[3] or "").strip(),
            "test_condition": str(row[4] or "").strip(),
            "expected_result": str(row[5] or "").strip(),
        }

        if has_priority:
            tc["priority"] = str(row[6] or "중").strip()
            tc["test_result"] = str(row[7] or "").strip() if len(row) > 7 else ""
        else:
            tc["priority"] = "중"
            tc["test_result"] = str(row[6] or "").strip() if len(row) > 6 else ""

        if tc["source_file"]:  # 소스파일명이 있는 행만
            test_cases.append(tc)

    wb.close()

    if not test_cases:
        return {
            "status": "error",
            "message": "테스트케이스 데이터가 없습니다 (헤더만 있고 데이터 행이 없음).",
            "expected_format": EXPECTED_FORMAT_DESC,
        }

    # 요약 정보
    from collections import Counter
    file_counts = Counter(tc["source_file"] for tc in test_cases)
    priority_counts = Counter(tc["priority"] for tc in test_cases)

    return {
        "status": "ok",
        "sheet_name": target_sheet.title,
        "has_priority": has_priority,
        "total_count": len(test_cases),
        "test_cases": test_cases,
        "summary": {
            "by_file": dict(file_counts),
            "by_priority": dict(priority_counts),
        },
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({
            "status": "error",
            "message": f"Usage: {sys.argv[0]} <excel_path>",
        }, ensure_ascii=False), file=sys.stdout)
        sys.exit(1)

    result = parse_excel(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["status"] == "ok" else 1)
