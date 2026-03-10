---
name: bxca_tcgen_md_junit
description: 소스 코드를 분석하여 테스트케이스를 Markdown 파일로 생성하고, JUnit 테스트 소스 코드를 일괄 생성합니다 (Java/Spring Boot 전용). 분석부터 테스트 실행까지 원스톱으로 수행합니다.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [project directory path]
---

주어진 프로젝트 디렉토리의 소스 코드를 분석하여 테스트케이스를 Markdown 파일로 생성하고, 해당 테스트케이스를 기반으로 JUnit 5 테스트 소스 코드를 일괄 생성합니다.

## 인자 파싱

`$ARGUMENTS`에서 **프로젝트 디렉토리 경로**를 추출합니다.

1. 경로가 존재하는지 확인합니다.
2. 경로가 존재하지 않거나 디렉토리가 아닌 경우 사용자에게 알리고 중단합니다.
3. `src/main/java` 디렉토리가 있는지 확인하여 Java/Spring Boot 프로젝트인지 검증합니다.
4. 인자가 없으면 사용자에게 프로젝트 경로를 안내하고 중단합니다.

---

## Phase 1: 소스 분석 및 테스트케이스 Markdown 생성

### Step 1: 대상 파일 수집

1. `$ARGUMENTS` 경로 아래의 소스 파일을 Glob으로 수집합니다.
   - 대상 확장자: `.java`
   - **제외 디렉토리**: `build/`, `target/`, `.gradle/`, `.git/`, `out/`, `bin/`
   - **제외 파일**: 테스트 파일(`*Test.java`, `*Tests.java`), 설정 파일(`*Application.java` 중 `main()` 메서드만 있는 진입점)
   - **분석 제외 대상**: 인터페이스(Mapper 등), 상수 enum, 단순 getter/setter만 있는 엔티티(`@Data` + 필드만), `@Configuration` 설정 클래스
2. 수집된 파일 목록을 사용자에게 간략히 보여줍니다.

### Step 2: 프로젝트 구조 분석

1. `build.gradle` 또는 `pom.xml`을 읽어 빌드 도구와 의존성을 파악합니다.
2. 기존 테스트 디렉토리(`src/test/java`)의 패키지 구조를 확인합니다.
3. 엔티티, 서비스, 컨트롤러 등 레이어별 파일을 분류합니다.

**파악할 핵심 정보:**
- 베이스 패키지 (예: `com.example.spapp`)
- 빌드 도구 (Gradle / Maven)
- Spring Boot 버전
- 테스트 의존성 (JUnit 5, Mockito, AssertJ 등)
- 엔티티 구조 (필드명, 생성자, Lombok 사용 여부)

### Step 3: 소스 코드 분석 및 테스트케이스 도출

각 소스 파일에 대해 Read 도구로 코드를 읽고 아래 기준으로 테스트케이스를 도출합니다.
분석 순서는 **Controller → Service → Config/기타** (레이어 순서)로 진행합니다.

**분석 대상:**
- **분기문(if/else, switch/case, 삼항연산자)**: 각 분기 조건별로 테스트케이스 생성
- **반복문의 경계 조건**: 빈 컬렉션, 단일 요소, 다수 요소
- **예외 처리(try/catch/throw)**: 정상 경로와 예외 경로 각각
- **입력 검증 로직**: null 체크, 범위 검사, 형식 검증 등
- **API 엔드포인트**: 정상 요청, 잘못된 요청, 인증/권한 검사
- **비즈니스 로직**: 계산, 상태 변경, 데이터 변환 등 핵심 로직
- **주석/JavaDoc**: `@param`, `@throws`, `TODO`, `FIXME` 등에서 테스트 힌트 추출

**테스트케이스 필드:**

| 필드 | 작성 규칙 |
|------|-----------|
| **소스파일명** | 해당 테스트케이스를 추출한 소스 파일명 (예: `EmpService.java`) |
| **테스트케이스명** | 테스트 목적을 간결하게 기술 (예: `직원 삭제 시 존재하지 않는 ID 처리`) |
| **테스트내용** | 구체적인 테스트 시나리오 설명 |
| **테스트조건** | 실제 코드의 분기 조건 + 관련 주석 포함 (예: `emp == null // 직원이 존재하지 않는 경우`) |
| **예상결과** | 해당 조건에서의 기대 동작 (예: `404 응답 반환`) |
| **중요도** | **상** / **중** / **하** |

**중요도 판단 기준:**
- **상**: CRUD의 CUD 핵심 경로, 보안 취약점(SQL Injection 등), 트랜잭션 롤백, 입력 검증 실패, 인증/권한
- **중**: 조회 시 존재/미존재 분기, 예외 발생 경로, insert/delete 실패 경로
- **하**: 전체 목록 단순 조회, 빈 목록 반환, 로깅 확인, 설정 초기화

### Step 4: Markdown 파일 생성

도출된 테스트케이스를 Markdown 파일로 저장합니다.

**출력 파일 규칙:**
- 파일명: `{디렉토리이름}_테스트케이스.md` (예: `spapp_테스트케이스.md`)
- 디렉토리 이름은 `$ARGUMENTS` 경로의 마지막 디렉토리명을 사용
- 파일 저장 위치: `$ARGUMENTS` 경로 (프로젝트 루트)
- **동일 파일이 이미 존재하면** `_v2`, `_v3` ... 순서로 버전 suffix를 붙여 생성합니다

**Markdown 파일 구조:**

```markdown
# {프로젝트명} 테스트케이스

> 생성일시: YYYY-MM-DD HH:mm
> 대상 디렉토리: {프로젝트 경로}
> 분석 파일 수: N개
> 테스트케이스 수: N개

## 요약

| 소스 파일 | 테스트케이스 수 | 중요도 상 | 중요도 중 | 중요도 하 |
|-----------|:-----------:|:-------:|:-------:|:-------:|
| EmpController.java | 12 | 4 | 5 | 3 |
| ... | ... | ... | ... | ... |
| **합계** | **51** | **15** | **22** | **14** |

---

## EmpController.java

### 1. 전체 직원 목록 조회 - 정상: 200 OK와 직원 목록 반환 [하]

- **테스트내용**: 전체 직원 목록을 조회하여 200 OK와 함께 직원 목록이 반환되는지 확인
- **테스트조건**: `empService.getAllEmps()` 정상 호출
- **예상결과**: 200 OK, 직원 목록 JSON 배열 반환

### 2. 직원 단건 조회 - 존재하는 ID: emp != null일 때 200 OK [중]

- **테스트내용**: ...
- **테스트조건**: `emp != null`
- **예상결과**: 200 OK, 직원 정보 JSON 반환

...

---

## EmpService.java

### 1. ...

...
```

**Markdown 작성 규칙:**
- 소스 파일별로 `## 소스파일명` 섹션으로 그룹핑
- 각 테스트케이스는 `### N. 테스트케이스명 [중요도]` 형식의 3단 헤더
- 중요도는 대괄호로 표시: `[상]`, `[중]`, `[하]`
- 소스 파일 내에서 중요도 **상 → 중 → 하** 순으로 정렬
- 소스 파일 순서: **Controller → Service → Config/기타** (레이어 순서)
- 각 소스 파일 섹션 사이에 수평선(`---`)으로 구분
- 요약 테이블에 파일별 건수와 중요도별 건수 집계

---

## Phase 2: JUnit 테스트 코드 일괄 생성

Phase 1에서 도출한 테스트케이스를 기반으로 JUnit 5 테스트 소스 코드를 생성합니다.

### Step 5: 소스 파일 상세 분석

Markdown에 기록된 테스트케이스의 소스 파일 목록에서 각 소스 파일을 Read로 읽습니다.

**파악할 정보:**
- 클래스의 레이어 (Controller / Service / Config / 기타)
- 의존성 주입된 필드 (`@Autowired`, 생성자 주입)
- public 메서드 시그니처와 반환 타입
- 사용하는 어노테이션 (`@Transactional`, `@GetMapping` 등)
- 예외 처리 패턴 (try-catch-throw)
- API 엔드포인트와 HTTP 메서드 (Controller인 경우)

### Step 6: JUnit 테스트 코드 생성

테스트케이스를 소스파일별로 그룹핑하여 테스트 클래스를 생성합니다.

#### 파일 배치
- 테스트 파일 위치: `src/test/java/{패키지경로}/{클래스명}Test.java`
- 소스의 패키지 구조를 그대로 미러링 (예: `controller/EmpController.java` → `controller/EmpControllerTest.java`)

#### 기존 테스트 파일 충돌 처리
기존 테스트 파일이 발견되면 사용자에게 아래 옵션을 제시합니다:
1. **덮어쓰기** — 기존 파일을 새 파일로 교체
2. **백업 후 덮어쓰기** — 기존 파일을 `{파일명}.bak`으로 백업한 뒤 새 파일 생성
3. **건너뛰기** — 해당 파일은 생성하지 않고 다음으로 진행

사용자가 별도 지시 없이 "덮어써줘" 등으로 일괄 승인하면 전체 덮어쓰기를 진행합니다.

#### 테스트케이스 → JUnit 매핑 규칙

Markdown 테스트케이스의 각 필드를 JUnit 코드에 아래와 같이 매핑합니다:

| Markdown 필드 | JUnit 매핑 대상 |
|--------------|---------------|
| **소스파일명** (섹션 헤더) | 테스트 클래스 결정 (예: `EmpService.java` → `EmpServiceTest.java`) |
| **테스트케이스명** | `@DisplayName` 값 (한국어 그대로 사용) |
| **테스트내용** | 테스트 메서드의 시나리오 설계 근거 |
| **테스트조건** | `when(...).thenReturn(...)` 또는 `when(...).thenThrow(...)` stub 설정의 근거 |
| **예상결과** | `assertThat(...)`, `status().isOk()` 등 assertion의 근거 |
| **중요도** | 테스트 배치 순서 (상 → 중 → 하 순으로 코드에 배치) |

**매핑 원칙:**
- 1개의 Markdown 테스트케이스 = 1개의 `@Test` 메서드 (원칙)
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
- `@DisplayName`에 Markdown의 `테스트케이스명` + 간략 설명 포함
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

---

## Phase 3: 빌드 검증 및 테스트 실행

### Step 7: 테스트 빌드 검증

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

### Step 8: 테스트 실행

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

---

## Phase 4: 테스트 실행결과 HTML 리포트 생성

### Step 9: HTML 리포트 생성

테스트 실행 결과를 파싱하여 전문적인 HTML 리포트 파일을 생성합니다.

이 스킬의 보조 스크립트 `generate_test_report.py`를 실행합니다.

```bash
python "<this_skill_directory>/generate_test_report.py" "<project_directory>"
```

여기서 `<this_skill_directory>`는 이 스킬의 실제 디렉토리 경로입니다.
예: `c:\DevHome\repository\customskills\.claude\skills\bxca_tcgen_md_junit`

**스크립트 동작:**
1. JUnit XML 결과 파일 위치를 자동 감지합니다:
   - Gradle: `build/test-results/test/TEST-*.xml`
   - Maven: `target/surefire-reports/TEST-*.xml`
2. 각 XML 파일에서 테스트 클래스명, 테스트 수, 성공/실패/스킵, 실행 시간, 개별 메서드 결과를 파싱합니다.
3. HTML 리포트를 생성합니다.

**출력 파일 규칙:**
- 파일명: `{디렉토리이름}_테스트케이스실행결과_{timestamp}.html`
  - timestamp 형식: `yyyyMMdd_HHmmss` (예: `20260310_143052`)
- 파일 저장 위치: `$ARGUMENTS` 경로 (프로젝트 루트)

**HTML 리포트 구성:**
- **헤더**: 프로젝트명, 실행 일시, 전체 통과율 (PASS/FAIL 배지)
- **요약 대시보드**: 전체 테스트 수, 성공 수, 실패 수, 스킵 수, 총 실행 시간
- **파일별 결과 테이블**: 테스트 파일명, 테스트 수, 성공/실패/스킵, 실행 시간, 결과 상태
- **개별 테스트 상세**: 각 테스트 메서드의 이름(@DisplayName), 실행 시간, 결과
- **실패 테스트 상세** (있을 경우): 실패 메시지, 스택 트레이스

**스크립트 출력 (stdout):**
- 성공: 생성된 HTML 파일 경로 출력
- 실패: 에러 메시지 출력

---

## Phase 5: 결과 요약

### Step 10: 최종 결과 보고

**보고 내용:**

#### 1. 생성된 산출물
- Markdown 테스트케이스 파일 경로
- 생성된 JUnit 테스트 파일 목록과 경로
- **HTML 테스트 실행결과 리포트 경로**

#### 2. 테스트 결과 요약

```
| 테스트 파일 | 테스트 수 | 결과 |
|------------|:--------:|:----:|
| EmpControllerTest.java | 12 | PASS |
| EmpServiceTest.java | 9 | PASS |
| ... | ... | ... |
| **합계** | **51** | **ALL PASS** |
```

#### 3. 커버리지
- 분석 소스 파일 수
- 도출된 테스트케이스 수
- 생성된 JUnit 테스트 메서드 수
- 전체 테스트 실행 결과 (성공/실패 건수)

---

## 테스트 데이터 생성 가이드라인

- 엔티티에 `@AllArgsConstructor`가 있으면 `new Entity("값1", "값2", ...)` 사용
- 엔티티에 생성자가 없으면 `new Entity()` + setter 체인 사용
- ID는 `"E001"`, `"D001"` 같은 문자열 패턴 사용
- 이름은 `"홍길동"`, `"김철수"` 같은 한국어 더미 데이터 사용
- 리스트는 `Arrays.asList(...)` 또는 `List.of(...)` 사용
- 빈 리스트는 `Collections.emptyList()` 사용

## 주의사항

- 이 스킬은 **Java / Spring Boot 프로젝트 전용**입니다. 다른 언어/프레임워크에는 사용할 수 없습니다.
- 소스 파일이 너무 크면(500줄 이상) public 메서드 위주로 분석합니다.
- 단순 getter/setter, 설정 클래스, 상수 정의 파일 등은 테스트케이스 도출 대상에서 제외합니다.
- 한국어로 테스트케이스를 작성합니다.
- 소스 파일이 존재하지 않는 테스트케이스는 건너뛰고 사용자에게 알립니다.
- 테스트케이스가 너무 추상적이면 소스 코드를 참고하여 구체적인 테스트로 변환합니다.
- 하나의 테스트케이스가 여러 `@Test` 메서드로 분리될 수 있습니다 (예: 경계값 테스트).
- 반대로 유사한 테스트케이스는 하나의 메서드로 통합할 수 있습니다.
