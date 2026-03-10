#!/usr/bin/env python3
"""
JUnit XML 테스트 결과를 파싱하여 HTML 리포트를 생성하는 스크립트.

사용법: python generate_test_report.py <project_directory>

출력: {project_name}_테스트케이스실행결과_{timestamp}.html
"""

import io
import os
import sys
import glob
from datetime import datetime
from xml.etree import ElementTree as ET

# Windows 환경 한글 깨짐 방지
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def find_test_results(project_dir):
    """JUnit XML 결과 파일을 자동 감지합니다."""
    # Gradle
    gradle_path = os.path.join(project_dir, "build", "test-results", "test", "TEST-*.xml")
    files = glob.glob(gradle_path)
    if files:
        return files, "Gradle"

    # Maven
    maven_path = os.path.join(project_dir, "target", "surefire-reports", "TEST-*.xml")
    files = glob.glob(maven_path)
    if files:
        return files, "Maven"

    return [], None


def parse_test_xml(xml_path):
    """JUnit XML 파일 하나를 파싱합니다."""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    suite = {
        "name": root.get("name", "Unknown"),
        "tests": int(root.get("tests", 0)),
        "failures": int(root.get("failures", 0)),
        "errors": int(root.get("errors", 0)),
        "skipped": int(root.get("skipped", 0)),
        "time": float(root.get("time", 0)),
        "test_cases": [],
    }

    for tc in root.iter("testcase"):
        case = {
            "name": tc.get("name", ""),
            "classname": tc.get("classname", ""),
            "time": float(tc.get("time", 0)),
            "status": "PASS",
            "message": "",
            "detail": "",
        }

        failure = tc.find("failure")
        error = tc.find("error")
        skipped_el = tc.find("skipped")

        if failure is not None:
            case["status"] = "FAIL"
            case["message"] = failure.get("message", "")
            case["detail"] = failure.text or ""
        elif error is not None:
            case["status"] = "ERROR"
            case["message"] = error.get("message", "")
            case["detail"] = error.text or ""
        elif skipped_el is not None:
            case["status"] = "SKIP"
            case["message"] = skipped_el.get("message", "")

        suite["test_cases"].append(case)

    suite["passed"] = suite["tests"] - suite["failures"] - suite["errors"] - suite["skipped"]
    # 짧은 클래스명 (패키지 제외)
    suite["short_name"] = suite["name"].rsplit(".", 1)[-1] if "." in suite["name"] else suite["name"]

    return suite


def generate_html(suites, project_name, project_dir, build_tool, timestamp):
    """HTML 리포트를 생성합니다."""
    total_tests = sum(s["tests"] for s in suites)
    total_passed = sum(s["passed"] for s in suites)
    total_failures = sum(s["failures"] + s["errors"] for s in suites)
    total_skipped = sum(s["skipped"] for s in suites)
    total_time = sum(s["time"] for s in suites)
    all_pass = total_failures == 0 and total_skipped == 0

    pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    badge_color = "#4caf50" if all_pass else ("#ff9800" if pass_rate >= 80 else "#f44336")
    badge_text = "ALL PASS" if all_pass else f"{pass_rate:.0f}%"

    # 실패한 테스트 수집
    failed_cases = []
    for s in suites:
        for tc in s["test_cases"]:
            if tc["status"] in ("FAIL", "ERROR"):
                failed_cases.append((s["short_name"], tc))

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{project_name} 테스트 실행결과</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; color: #333; padding: 24px; }}
  .container {{ max-width: 1100px; margin: 0 auto; }}

  /* Header */
  .header {{ background: linear-gradient(135deg, #1a237e, #283593); color: #fff; padding: 28px 32px;
             border-radius: 12px; margin-bottom: 24px; }}
  .header h1 {{ font-size: 22px; margin-bottom: 8px; }}
  .header-meta {{ font-size: 13px; opacity: 0.85; line-height: 1.6; }}
  .badge {{ display: inline-block; padding: 4px 14px; border-radius: 20px; font-weight: 700;
            font-size: 13px; color: #fff; background: {badge_color}; margin-left: 12px; vertical-align: middle; }}

  /* Dashboard */
  .dashboard {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }}
  .card {{ background: #fff; border-radius: 10px; padding: 20px; text-align: center;
           box-shadow: 0 2px 8px rgba(0,0,0,0.06); }}
  .card .number {{ font-size: 32px; font-weight: 700; margin-bottom: 4px; }}
  .card .label {{ font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }}
  .card.total .number {{ color: #1a237e; }}
  .card.pass .number {{ color: #4caf50; }}
  .card.fail .number {{ color: #f44336; }}
  .card.skip .number {{ color: #ff9800; }}
  .card.time .number {{ color: #607d8b; font-size: 24px; }}

  /* Table */
  .section {{ background: #fff; border-radius: 10px; padding: 24px; margin-bottom: 24px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06); }}
  .section h2 {{ font-size: 16px; color: #1a237e; margin-bottom: 16px; padding-bottom: 8px;
                  border-bottom: 2px solid #e8eaf6; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  th {{ background: #e8eaf6; color: #1a237e; padding: 10px 12px; text-align: left; font-weight: 600; }}
  td {{ padding: 9px 12px; border-bottom: 1px solid #f0f0f0; }}
  tr:hover td {{ background: #fafbff; }}
  .status {{ display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px;
             font-weight: 600; text-transform: uppercase; }}
  .status.pass {{ background: #e8f5e9; color: #2e7d32; }}
  .status.fail {{ background: #ffebee; color: #c62828; }}
  .status.error {{ background: #ffebee; color: #c62828; }}
  .status.skip {{ background: #fff3e0; color: #e65100; }}
  .text-right {{ text-align: right; }}
  .text-center {{ text-align: center; }}

  /* Detail toggle */
  .detail-row td {{ padding: 0; }}
  .detail-content {{ background: #fafafa; padding: 12px 16px; font-family: 'Consolas', monospace;
                     font-size: 12px; white-space: pre-wrap; word-break: break-all;
                     max-height: 300px; overflow-y: auto; color: #c62828; border-left: 3px solid #f44336; }}

  /* Footer */
  .footer {{ text-align: center; font-size: 11px; color: #aaa; margin-top: 24px; }}

  @media (max-width: 768px) {{
    .dashboard {{ grid-template-columns: repeat(2, 1fr); }}
  }}
</style>
</head>
<body>
<div class="container">

<!-- Header -->
<div class="header">
  <h1>{project_name} 테스트 실행결과 <span class="badge">{badge_text}</span></h1>
  <div class="header-meta">
    실행 일시: {timestamp}<br>
    프로젝트 경로: {project_dir}<br>
    빌드 도구: {build_tool}
  </div>
</div>

<!-- Dashboard -->
<div class="dashboard">
  <div class="card total">
    <div class="number">{total_tests}</div>
    <div class="label">전체 테스트</div>
  </div>
  <div class="card pass">
    <div class="number">{total_passed}</div>
    <div class="label">성공</div>
  </div>
  <div class="card fail">
    <div class="number">{total_failures}</div>
    <div class="label">실패</div>
  </div>
  <div class="card skip">
    <div class="number">{total_skipped}</div>
    <div class="label">스킵</div>
  </div>
  <div class="card time">
    <div class="number">{total_time:.2f}s</div>
    <div class="label">실행 시간</div>
  </div>
</div>

<!-- Summary Table -->
<div class="section">
  <h2>파일별 결과 요약</h2>
  <table>
    <thead>
      <tr>
        <th>테스트 파일</th>
        <th class="text-center">테스트 수</th>
        <th class="text-center">성공</th>
        <th class="text-center">실패</th>
        <th class="text-center">스킵</th>
        <th class="text-right">실행 시간</th>
        <th class="text-center">결과</th>
      </tr>
    </thead>
    <tbody>
"""

    for s in suites:
        suite_fail = s["failures"] + s["errors"]
        status_cls = "pass" if suite_fail == 0 and s["skipped"] == 0 else ("fail" if suite_fail > 0 else "skip")
        status_text = "PASS" if status_cls == "pass" else ("FAIL" if status_cls == "fail" else "SKIP")
        html += f"""      <tr>
        <td>{s["short_name"]}</td>
        <td class="text-center">{s["tests"]}</td>
        <td class="text-center">{s["passed"]}</td>
        <td class="text-center">{suite_fail}</td>
        <td class="text-center">{s["skipped"]}</td>
        <td class="text-right">{s["time"]:.3f}s</td>
        <td class="text-center"><span class="status {status_cls}">{status_text}</span></td>
      </tr>
"""

    html += f"""      <tr style="font-weight:700; background:#f5f5f5;">
        <td>합계</td>
        <td class="text-center">{total_tests}</td>
        <td class="text-center">{total_passed}</td>
        <td class="text-center">{total_failures}</td>
        <td class="text-center">{total_skipped}</td>
        <td class="text-right">{total_time:.3f}s</td>
        <td class="text-center"><span class="status {"pass" if all_pass else "fail"}">{"ALL PASS" if all_pass else "FAIL"}</span></td>
      </tr>
    </tbody>
  </table>
</div>
"""

    # 개별 테스트 상세 (파일별)
    for s in suites:
        html += f"""
<div class="section">
  <h2>{s["short_name"]} ({s["tests"]}개 테스트)</h2>
  <table>
    <thead>
      <tr>
        <th style="width:5%">#</th>
        <th>테스트 메서드</th>
        <th class="text-right" style="width:12%">실행 시간</th>
        <th class="text-center" style="width:10%">결과</th>
      </tr>
    </thead>
    <tbody>
"""
        for idx, tc in enumerate(s["test_cases"], 1):
            status_cls = tc["status"].lower()
            html += f"""      <tr>
        <td class="text-center">{idx}</td>
        <td>{_escape_html(tc["name"])}</td>
        <td class="text-right">{tc["time"]:.3f}s</td>
        <td class="text-center"><span class="status {status_cls}">{tc["status"]}</span></td>
      </tr>
"""
            if tc["status"] in ("FAIL", "ERROR") and tc["detail"]:
                html += f"""      <tr class="detail-row">
        <td colspan="4"><div class="detail-content">{_escape_html(tc["message"])}\n{_escape_html(tc["detail"][:2000])}</div></td>
      </tr>
"""

        html += """    </tbody>
  </table>
</div>
"""

    # 실패 테스트 요약 (있을 경우)
    if failed_cases:
        html += """
<div class="section">
  <h2 style="color:#c62828;">실패 테스트 상세</h2>
  <table>
    <thead>
      <tr>
        <th>테스트 클래스</th>
        <th>테스트 메서드</th>
        <th>에러 메시지</th>
      </tr>
    </thead>
    <tbody>
"""
        for suite_name, tc in failed_cases:
            html += f"""      <tr>
        <td>{_escape_html(suite_name)}</td>
        <td>{_escape_html(tc["name"])}</td>
        <td style="color:#c62828;">{_escape_html(tc["message"][:200])}</td>
      </tr>
"""
        html += """    </tbody>
  </table>
</div>
"""

    html += f"""
<div class="footer">
  Generated by bxca_tcgen_md_junit skill &middot; {timestamp}
</div>

</div>
</body>
</html>"""

    return html


def _escape_html(text):
    """HTML 특수문자를 이스케이프합니다."""
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <project_directory>", file=sys.stderr)
        sys.exit(1)

    project_dir = sys.argv[1]
    if not os.path.isdir(project_dir):
        print(f"Error: 디렉토리가 존재하지 않습니다: {project_dir}", file=sys.stderr)
        sys.exit(1)

    # 테스트 결과 파일 검색
    xml_files, build_tool = find_test_results(project_dir)
    if not xml_files:
        print("Error: JUnit XML 결과 파일을 찾을 수 없습니다. 테스트를 먼저 실행해 주세요.", file=sys.stderr)
        sys.exit(1)

    # XML 파싱
    suites = []
    for xml_file in sorted(xml_files):
        try:
            suite = parse_test_xml(xml_file)
            suites.append(suite)
        except Exception as e:
            print(f"Warning: {xml_file} 파싱 실패 - {e}", file=sys.stderr)

    if not suites:
        print("Error: 파싱 가능한 테스트 결과가 없습니다.", file=sys.stderr)
        sys.exit(1)

    # 프로젝트 이름 추출
    project_name = os.path.basename(os.path.normpath(project_dir))

    # 타임스탬프
    now = datetime.now()
    timestamp_file = now.strftime("%Y%m%d_%H%M%S")
    timestamp_display = now.strftime("%Y-%m-%d %H:%M:%S")

    # HTML 생성
    html = generate_html(suites, project_name, project_dir, build_tool, timestamp_display)

    # 파일 저장
    output_filename = f"{project_name}_테스트케이스실행결과_{timestamp_file}.html"
    output_path = os.path.join(project_dir, output_filename)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(output_path)


if __name__ == "__main__":
    main()
