---
name: tcgen2
description: 소스 코드를 분석하여 테스트케이스를 Excel 파일로 자동 생성합니다. xlsx 스킬을 활용하여 전문적인 Excel 산출물을 만듭니다.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write
argument-hint: [directory path]
---

주어진 디렉토리 `$ARGUMENTS` 아래의 소스 파일을 분석하여 테스트케이스를 Excel(.xlsx) 파일로 생성합니다.
Excel 생성은 `~/.claude/skills/.agents/skills/xlsx/` 에 설치된 **xlsx 스킬의 규칙과 패턴**을 따릅니다.

## 실행 절차

### Step 1: 대상 파일 수집
1. `$ARGUMENTS` 경로 아래의 소스 파일을 Glob으로 수집합니다.
   - 지원 확장자: `.java`, `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.go`, `.cs`, `.kt`, `.rb`, `.php`, `.c`, `.cpp`, `.rs`
   - `node_modules/`, `build/`, `dist/`, `target/`, `.gradle/`, `__pycache__/`, `.git/` 등 빌드/의존성 디렉토리는 제외합니다.
   - 테스트 파일(`*Test.java`, `*_test.py`, `*.test.ts`, `*.spec.ts` 등)은 제외합니다.
2. 수집된 파일 목록을 사용자에게 간략히 보여줍니다.

### Step 2: 소스 코드 분석 및 테스트케이스 도출
각 소스 파일에 대해 Read 도구로 코드를 읽고 아래 기준으로 테스트케이스를 도출합니다:

**분석 대상:**
- **분기문(if/else, switch/case, 삼항연산자)**: 각 분기 조건별로 테스트케이스 생성
- **반복문의 경계 조건**: 빈 컬렉션, 단일 요소, 다수 요소
- **예외 처리(try/catch/throw)**: 정상 경로와 예외 경로 각각
- **입력 검증 로직**: null 체크, 범위 검사, 형식 검증 등
- **API 엔드포인트**: 정상 요청, 잘못된 요청, 인증/권한 검사
- **비즈니스 로직**: 계산, 상태 변경, 데이터 변환 등 핵심 로직
- **주석/JavaDoc**: `@param`, `@throws`, `TODO`, `FIXME` 등에서 테스트 힌트 추출

**테스트케이스 필드 작성 규칙:**

| 필드 | 작성 규칙 |
|------|-----------|
| **테스트케이스ID(소스파일명)** | 해당 테스트케이스를 추출한 소스 파일명 (예: `EmpService.java`) |
| **테스트케이스명** | 테스트 목적을 간결하게 기술 (예: `직원 삭제 시 존재하지 않는 ID 처리`) |
| **테스트내용** | 구체적인 테스트 시나리오 설명 (예: `존재하지 않는 직원 ID로 삭제 요청 시 적절한 예외가 발생하는지 확인`) |
| **테스트조건** | 실제 코드의 분기 조건 + 관련 주석 포함 (예: `emp == null // 직원이 존재하지 않는 경우`) |
| **예상결과** | 해당 조건에서의 기대 동작 (예: `ResourceNotFoundException 발생 또는 404 응답 반환`) |
| **테스트결과** | 항상 공란으로 둡니다 |

### Step 3: Excel 파일 생성 (xlsx 스킬 방식)

xlsx 스킬의 규칙에 따라 openpyxl로 직접 Excel 파일을 생성합니다.
아래 Python 코드를 Bash 도구로 실행하여 Excel 파일을 생성하세요.

**출력 파일 규칙:**
- 파일명: `{디렉토리이름}_테스트케이스.xlsx` (예: `spapp_테스트케이스.xlsx`)
- 디렉토리 이름은 `$ARGUMENTS` 경로의 마지막 디렉토리명을 사용
- 파일 저장 위치: `$ARGUMENTS` 경로 (분석 대상 디렉토리의 루트)

**Excel 생성 코드 템플릿:**

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = Workbook()
wb.remove(wb.active)
ws = wb.create_sheet(title="테스트케이스_자동생성")

# --- 스타일 정의 (xlsx 스킬 규칙: 전문적 폰트, 일관된 서식) ---
header_font = Font(name="Arial", bold=True, size=11, color="FFFFFF")
header_fill = PatternFill("solid", fgColor="4472C4")
header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
thin_border = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"), bottom=Side(style="thin")
)
cell_font = Font(name="Arial", size=10)
cell_alignment = Alignment(vertical="top", wrap_text=True)
center_alignment = Alignment(horizontal="center", vertical="top")

# --- 헤더 ---
headers = [
    ("No", 6),
    ("테스트케이스ID\n(소스파일명)", 30),
    ("테스트케이스명", 35),
    ("테스트내용", 50),
    ("테스트조건", 40),
    ("예상결과", 40),
    ("테스트결과", 15),
]
for col_idx, (text, width) in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col_idx, value=text)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_alignment
    cell.border = thin_border
    ws.column_dimensions[get_column_letter(col_idx)].width = width
ws.row_dimensions[1].height = 35

# --- 데이터 (여기에 도출한 테스트케이스를 채워넣으세요) ---
test_cases = [
    # ("소스파일명", "테스트케이스명", "테스트내용", "테스트조건", "예상결과"),
]

for row_idx, (tc_id, tc_name, tc_content, tc_condition, tc_expected) in enumerate(test_cases, 2):
    values = [row_idx - 1, tc_id, tc_name, tc_content, tc_condition, tc_expected, ""]
    for col_idx, value in enumerate(values, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        cell.font = cell_font
        cell.border = thin_border
        cell.alignment = center_alignment if col_idx in (1, 7) else cell_alignment

# --- 자동 필터 + 틀 고정 ---
if test_cases:
    ws.auto_filter.ref = f"A1:G{len(test_cases) + 1}"
ws.freeze_panes = "A2"

# --- 저장 ---
output_path = "<output_path>"
wb.save(output_path)
print(f"Generated: {output_path} ({len(test_cases)} test cases)")
```

**중요 (xlsx 스킬 규칙 준수):**
- 전문적 폰트 사용 (Arial 권장)
- 하드코딩된 계산값 대신 Excel 수식 사용 (해당되는 경우)
- 수식을 사용한 경우 반드시 `recalc.py`로 재계산:
  ```bash
  python ~/.claude/skills/.agents/skills/xlsx/scripts/recalc.py "<output_path>"
  ```
- 이 스킬에서는 수식 없이 데이터만 넣으므로 recalc은 선택사항입니다.

### Step 4: 결과 보고
- 생성된 Excel 파일 경로를 사용자에게 알려줍니다.
- 총 분석 파일 수와 도출된 테스트케이스 수를 요약합니다.
- 파일별 테스트케이스 수를 간략히 표로 보여줍니다.

## 주의사항
- 소스 파일이 너무 크면(500줄 이상) 주요 메서드 위주로 분석합니다.
- 단순 getter/setter, 설정 클래스, 상수 정의 파일 등은 테스트케이스 도출 대상에서 제외합니다.
- 한국어로 테스트케이스를 작성합니다.
