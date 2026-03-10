---
name: bxca_junit_tcgen_from_excel
description: 테스트케이스 Excel 파일을 기반으로 JUnit 테스트 소스 코드를 일괄 생성합니다 (Java/Spring Boot 전용). bxca_testcase_gen 스킬로 만든 Excel을 첨부하여 실행하세요.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [project directory] [testcase excel path]
---

테스트케이스 Excel 파일을 읽고, 프로젝트 디렉토리의 소스 코드를 참고하여 JUnit 5 테스트 소스 코드를 일괄 생성합니다.

## 인자 파싱

`$ARGUMENTS`에서 **프로젝트 디렉토리**와 **Excel 파일 경로** 두 개를 추출합니다.
인자 순서는 자유이며 아래 규칙으로 자동 판별합니다:

1. `.xlsx`로 끝나는 인자 → **Excel 파일 경로**
2. 디렉토리인 인자 → **프로젝트 디렉토리**
3. 두 인자 모두 `.xlsx`이면 → 사용자에게 프로젝트 디렉토리를 확인 후 중단
4. 인자가 1개만 주어진 경우:
   - `.xlsx`이면 Excel 경로로 판단하고, 프로젝트 디렉토리를 사용자에게 질문
   - 디렉토리이면 프로젝트 경로로 판단하고, Excel 경로를 사용자에게 질문
5. 인자가 없으면 사용자에게 두 경로 모두 안내하고 중단

## 실행 절차

### Step 0: Excel 포맷 검증

이 스킬의 보조 스크립트 `parse_testcase_excel.py`를 실행하여 Excel을 파싱합니다.

```bash
python "<this_skill_directory>/parse_testcase_excel.py" "<excel_path>"
```

여기서 `<this_skill_directory>`는 이 스킬의 실제 디렉토리 경로입니다.
예: `c:\DevHome\repository\customskills\.claude\skills\bxca_junit_tcgen_from_excel`

**스크립트 출력 (JSON, stdout):**
- 성공: `{"status": "ok", "test_cases": [...], "summary": {...}}`
- 실패: `{"status": "error", "message": "...", "expected_format": {...}}`

**실패 시 대응:**
사용자에게 아래 내용을 안내하고 중단합니다:
- 에러 메시지 (스크립트가 반환한 `message`)
- 올바른 Excel 포맷 설명:
  - `bxca_testcase_gen` 스킬로 생성한 `.xlsx` 파일
  - 시트명: `테스트케이스`를 포함하는 이름 (예: `테스트케이스_자동생성`)
  - 헤더(8열): No, 테스트케이스ID(소스파일명), 테스트케이스명, 테스트내용, 테스트조건, 예상결과, 중요도, 테스트결과
  - 또는 헤더(7열): 중요도 열 없는 버전도 지원
  - 헤더는 핵심 키워드 포함 여부로 유연하게 검증됨

### Step 1: 프로젝트 구조 분석

1. 프로젝트 디렉토리 경로가 유효한지 확인합니다.
2. `src/main/java` 아래의 소스 파일을 Glob으로 수집합니다.
3. `build.gradle` 또는 `pom.xml`을 읽어 빌드 도구와 의존성을 파악합니다.
4. 기존 테스트 디렉토리(`src/test/java`)의 패키지 구조를 확인합니다.
5. 엔티티, 서비스, 컨트롤러 등 레이어별 파일을 분류합니다.

**파악할 핵심 정보:**
- 베이스 패키지 (예: `com.example.spapp`)
- 빌드 도구 (Gradle / Maven)
- Spring Boot 버전
- 테스트 의존성 (JUnit 5, Mockito, AssertJ 등)
- 엔티티 구조 (필드명, 생성자, Lombok 사용 여부)

### Step 2: 소스 파일 분석

Excel에서 추출한 `source_file` 목록의 각 소스 파일을 Read로 읽습니다.

**파악할 정보:**
- 클래스의 레이어 (Controller / Service / Config / 기타)
- 의존성 주입된 필드 (`@Autowired`, 생성자 주입)
- public 메서드 시그니처와 반환 타입
- 사용하는 어노테이션 (`@Transactional`, `@GetMapping` 등)
- 예외 처리 패턴 (try-catch-throw)
- API 엔드포인트와 HTTP 메서드 (Controller인 경우)

### Step 3: JUnit 테스트 코드 생성

Excel의 테스트케이스를 소스파일별로 그룹핑하여 테스트 클래스를 생성합니다.

**테스트 클래스 생성 규칙:**

#### 파일 배치
- 테스트 파일 위치: `src/test/java/{패키지경로}/{클래스명}Test.java`
- 소스의 패키지 구조를 그대로 미러링 (예: `controller/EmpController.java` → `controller/EmpControllerTest.java`)

#### 기존 테스트 파일 충돌 처리
기존 테스트 파일이 발견되면 사용자에게 아래 옵션을 제시합니다:
1. **덮어쓰기** — 기존 파일을 새 파일로 교체
2. **백업 후 덮어쓰기** — 기존 파일을 `{파일명}.bak`으로 백업한 뒤 새 파일 생성
3. **건너뛰기** — 해당 파일은 생성하지 않고 다음으로 진행

사용자가 별도 지시 없이 "덮어써줘" 등으로 일괄 승인하면 전체 덮어쓰기를 진행합니다.

#### Excel → JUnit 매핑 규칙

Excel 테스트케이스의 각 필드를 JUnit 코드에 아래와 같이 매핑합니다:

| Excel 필드 | JUnit 매핑 대상 |
|-----------|---------------|
| **테스트케이스ID(소스파일명)** | 테스트 클래스 결정 (예: `EmpService.java` → `EmpServiceTest.java`) |
| **테스트케이스명** | `@DisplayName` 값 (한국어 그대로 사용) |
| **테스트내용** | 테스트 메서드의 시나리오 설계 근거 |
| **테스트조건** | `when(...).thenReturn(...)` 또는 `when(...).thenThrow(...)` stub 설정의 근거 |
| **예상결과** | `assertThat(...)`, `status().isOk()` 등 assertion의 근거 |
| **중요도** | 테스트 배치 순서 (상 → 중 → 하 순으로 코드에 배치) |

**매핑 원칙:**
- 1개의 Excel 테스트케이스 = 1개의 `@Test` 메서드 (원칙)
- 테스트조건에 코드 분기 조건이 있으면 해당 조건을 stub으로 재현
- 예상결과에 HTTP 상태코드가 있으면 `status().isXxx()` 검증에 반영
- 예상결과에 예외 클래스가 있으면 `assertThatThrownBy()` 또는 `assertThrows()` 사용

#### 테스트 패턴 (레이어별)

**Controller 테스트:**
```java
@ExtendWith(MockitoExtension.class)
class XxxControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private XxxService xxxService;

    @InjectMocks
    private XxxController xxxController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(xxxController).build();
        objectMapper = new ObjectMapper();
    }

    // ... 테스트 메서드
}
```
- `MockMvcBuilders.standaloneSetup()` 사용 (Spring Context 로딩 없이)
- `@Mock`으로 Service 모킹
- `mockMvc.perform()` + `status()`, `jsonPath()` 검증
- POST/PUT 요청 시 `objectMapper.writeValueAsString()` 사용

**Service 테스트:**
```java
@ExtendWith(MockitoExtension.class)
class XxxServiceTest {
    @Mock
    private XxxMapper xxxMapper;

    @InjectMocks
    private XxxService xxxService;

    // ... 테스트 메서드
}
```
- `@Mock`으로 Mapper/Repository 모킹
- `when(...).thenReturn(...)` / `when(...).thenThrow(...)` 패턴
- `assertThat()` (AssertJ) 검증
- `assertThatThrownBy()` 예외 검증
- `verify()` 호출 확인

**Config/기타 테스트:**
- 필요한 의존성을 `@Mock`으로 모킹
- `doAnswer()`, `doThrow()` 등 void 메서드 모킹 시 사용

#### 코드 스타일 규칙
- **JUnit 5** (`@Test`, `@DisplayName`, `@ExtendWith`)
- **Mockito** (`@Mock`, `@InjectMocks`, `when`, `verify`)
- **AssertJ** 단언 (`assertThat`, `assertThatThrownBy`)
- `@DisplayName`에 Excel의 `테스트케이스명` + 간략 설명 포함
- 메서드명은 `{메서드명}_{시나리오}` 형식 (예: `getAllEmps_returnsListOfEmps`)
- 각 테스트 메서드 사이에 빈 줄과 섹션 주석 (`// ========== 섹션명 ==========`)
- **한국어 @DisplayName**, **영어 메서드명**
- 중요도 상 테스트를 파일 상단에 배치

#### 중요 주의사항
- **Spring Boot 3.2.0+에서 `@MockBean`은 사용하지 않습니다.** `@ExtendWith(MockitoExtension.class)` + `@Mock` + `@InjectMocks`를 사용합니다.
- Controller 테스트에서 `@WebMvcTest` 대신 `MockMvcBuilders.standaloneSetup()` 사용
- 예외를 throw하는 Controller에서 MockMvc로 예외 전파 시 `assertThrows(Exception.class, ...)` 패턴 사용
- `lenient()` 사용 지양 — UnnecessaryStubbingException이 발생하지 않도록 필요한 stub만 설정
- 테스트 데이터는 프로젝트의 엔티티 구조에 맞춰 생성 (Lombok 생성자 활용)

### Step 4: 테스트 빌드 검증

생성된 테스트가 컴파일되는지 확인합니다.
OS와 빌드 도구에 따라 적절한 명령을 사용합니다:

```bash
# Gradle (OS 자동 감지)
if [ -f "./gradlew" ]; then
    ./gradlew compileTestJava 2>&1 | tail -20
elif [ -f "./gradlew.bat" ]; then
    cmd.exe //c ".\gradlew.bat compileTestJava" 2>&1 | tail -20
fi

# Maven (OS 자동 감지)
if [ -f "./mvnw" ]; then
    ./mvnw compile test-compile 2>&1 | tail -20
elif [ -f "./mvnw.cmd" ]; then
    cmd.exe //c ".\mvnw.cmd compile test-compile" 2>&1 | tail -20
fi
```

- 컴파일 에러 발생 시 에러 메시지를 분석하고 코드를 수정합니다.
- import 누락, 타입 불일치 등 일반적인 문제를 자동 수정합니다.

### Step 5: 테스트 실행

```bash
# Gradle (OS 자동 감지)
if [ -f "./gradlew" ]; then
    ./gradlew test 2>&1 | tail -30
elif [ -f "./gradlew.bat" ]; then
    cmd.exe //c ".\gradlew.bat test" 2>&1 | tail -30
fi

# Maven (OS 자동 감지)
if [ -f "./mvnw" ]; then
    ./mvnw test 2>&1 | tail -30
elif [ -f "./mvnw.cmd" ]; then
    cmd.exe //c ".\mvnw.cmd test" 2>&1 | tail -30
fi
```

**실패 시 자동 수정 (최대 3회):**
1. 테스트 실패 원인을 분석합니다 (에러 메시지, 스택 트레이스).
2. 코드를 수정하고 재실행합니다.
3. 최대 3회 반복합니다.

**3회 모두 실패한 경우:**
- 수정을 중단하고 사용자에게 보고합니다.
- 성공한 테스트와 실패한 테스트를 분리하여 표시합니다.
- 실패한 테스트의 에러 메시지와 예상 원인을 함께 안내합니다.
- 사용자가 수동 수정할 수 있도록 실패 테스트의 파일 경로와 라인 번호를 제공합니다.

### Step 6: 결과 요약

생성 결과를 사용자에게 보고합니다:

**보고 내용:**
- 생성된 테스트 파일 목록과 경로
- 파일별 테스트 메서드 수
- 전체 테스트 실행 결과 (성공/실패 건수)
- Excel 테스트케이스 대비 커버리지 (생성된 테스트 수 / Excel 테스트케이스 수)

**요약 표 형식:**
```
| 테스트 파일 | 테스트 수 | 결과 |
|------------|:--------:|:----:|
| EmpControllerTest.java | 13 | PASS |
| ... | ... | ... |
| **합계** | **51** | **ALL PASS** |
```

## 테스트 데이터 생성 가이드라인

- 엔티티에 `@AllArgsConstructor`가 있으면 `new Entity("값1", "값2", ...)` 사용
- 엔티티에 생성자가 없으면 `new Entity()` + setter 체인 사용
- ID는 `"E001"`, `"D001"` 같은 문자열 패턴 사용
- 이름은 `"홍길동"`, `"김철수"` 같은 한국어 더미 데이터 사용
- 리스트는 `Arrays.asList(...)` 또는 `List.of(...)` 사용
- 빈 리스트는 `Collections.emptyList()` 사용

## 주의사항

- 소스 파일이 존재하지 않는 테스트케이스는 건너뛰고 사용자에게 알립니다.
- Excel의 테스트케이스가 너무 추상적이면 소스 코드를 참고하여 구체적인 테스트로 변환합니다.
- 하나의 Excel 테스트케이스가 여러 `@Test` 메서드로 분리될 수 있습니다 (예: 경계값 테스트).
- 반대로 유사한 테스트케이스는 하나의 메서드로 통합할 수 있습니다.
- openpyxl이 미설치 상태라면 스크립트가 자동으로 pip install합니다.
- 이 스킬은 **Java / Spring Boot 프로젝트 전용**입니다. 다른 언어/프레임워크에는 사용할 수 없습니다.
