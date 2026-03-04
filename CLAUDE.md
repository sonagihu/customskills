# Custom Skills & Commands Project

Claude Code의 커스텀 skill과 command를 개발하고 관리하는 프로젝트입니다.

## 프로젝트 구조

```
customskills/
├── CLAUDE.md                    # 프로젝트 설명 (이 파일)
├── .claude/
│   ├── skills/                  # 커스텀 Skills (권장)
│   │   ├── explain-code/        # 코드 설명 skill
│   │   │   └── SKILL.md
│   │   ├── review-code/         # 코드 리뷰 skill
│   │   │   └── SKILL.md
│   │   └── scaffold/            # 새 skill 생성 도우미
│   │       └── SKILL.md
│   └── commands/                # 커스텀 Commands (레거시)
│       ├── commit.md            # 커밋 메시지 생성
│       └── todo.md              # TODO 코멘트 검색
```

## Skill vs Command

- **Skill** (`.claude/skills/`): 권장 방식. 디렉토리 단위로 관리하며 보조 파일, 스크립트, subagent 실행 등을 지원
- **Command** (`.claude/commands/`): 레거시 방식. 단일 마크다운 파일로 간단한 워크플로우에 적합

## 새 Skill 만들기

1. `.claude/skills/<skill-name>/SKILL.md` 파일 생성
2. YAML frontmatter에 메타데이터 작성 (name, description 등)
3. 마크다운 본문에 skill 지침 작성
4. `/scaffold <name>` 커맨드로 템플릿에서 생성 가능

## 주요 Frontmatter 필드

| 필드 | 설명 |
|------|------|
| `name` | skill 이름 (소문자, 하이픈) |
| `description` | 설명 (Claude가 자동 호출 판단에 사용) |
| `user-invocable` | `/` 메뉴에 표시 여부 (기본: true) |
| `disable-model-invocation` | Claude 자동 호출 방지 (기본: false) |
| `allowed-tools` | 허용 도구 목록 (쉼표 구분) |
| `argument-hint` | 인자 힌트 표시 |
| `context` | `fork` 설정 시 subagent에서 실행 |
