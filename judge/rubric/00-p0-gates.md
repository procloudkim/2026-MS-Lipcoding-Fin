# P0 하드 게이트

게이트는 PASS/FAIL 기준이다. 하나라도 FAIL이면 최종 판정은 `BLOCK`이다. WARN은 게이트 통과 경고, SKIP 게이트는 `CONDITIONAL` 사유다.

| 게이트 | 정의 | PASS 기준 | 실패 신호 | 검사 모듈 | 증거 위치 |
| --- | --- | --- | --- | --- | --- |
| G1 | 개인 생산성 향상 웹앱 | 사용자가 할 일·메모·결정 비용을 줄이는 실제 생산성 흐름을 수행 | 랜딩/데모뿐, 생산성 작업 없음 | `01-static-evidence`, `02-local-smoke` | README, `docs/evaluation/AI_JUDGE_BRIEF.md`, UI smoke |
| G2 | Copilot SDK 실제·추적가능 사용 | dependency → import → session → endpoint 경로가 이어짐 | 패키지만 설치, 정적 문구, 미사용 import, 가짜 assistant UI | `01-static-evidence`, `03-sdk-evidence` | `package.json`, `server.js`, SDK smoke JSON |
| G3 | Azure 배포 + public URL smoke | 공개 URL에서 `/`, `/api/health`, 핵심 API가 200 계열로 응답 | URL 없음, 로컬만 동작, 배포 5xx/404 | `04-azure-smoke` | `--azure-url <URL>`, 리포트 |
| G4 | 100% 한국어 UI | `public/` 사용자 표시 문자열이 한국어 중심이고 영어 UI 잔재 없음 | 버튼/상태/오류가 영어, 혼합 UI | `05-ui-korean` | `public/`, 브라우저 스냅샷 |
| G5 | 로컬 부팅 + 핵심 액션 동작 | 서버 부팅 후 health·plan·assist smoke 통과 | 서버 부팅 실패, 핵심 POST 실패, 빈 입력 처리 불능 | `02-local-smoke` | 로컬 smoke 로그, API 응답 |
| G6 | 시크릿 미커밋 / `.gitignore` 보호 | `.env`, 토큰, Azure/GitHub/Copilot 키, 로컬 상태 미추적 | `.env` 추적, 키 문자열, `.azure` 커밋 | `01-static-evidence` | git status, `.gitignore`, secret scan |

## G1 — 개인 생산성 향상 웹앱

| 항목 | 기준 |
| --- | --- |
| 통과 | 앱 설명과 핵심 화면이 “오늘의 우선순위/분류/다음 행동”처럼 생산성 개선을 직접 수행한다. |
| 실패 | 제품 개념이 게임·홍보 페이지·기술 데모에 머물고 사용자의 생산성 결과물이 없다. |
| 증거 | README, AI 심사 브리프, 로컬 핵심 액션 응답, UI 첫 화면. |

## G2 — Copilot SDK 실제·추적가능 사용

| 항목 | 기준 |
| --- | --- |
| 통과 | `@github/copilot-sdk` 의존성, `CopilotClient` import, session 생성, `/api/plan`·`/api/assist` 등 실제 엔드포인트 호출 흐름이 확인된다. |
| 실패 | SDK 없이 fallback만 사용, `/api/copilot` 같은 존재하지 않는 경로만 문서화, UI 문구로만 Copilot을 주장한다. |
| 증거 | `server.js`, `package.json`, `03-sdk-evidence` 결과, 응답의 `source`. |

## G3 — Azure 배포 + public URL smoke

| 항목 | 기준 |
| --- | --- |
| 통과 | `--azure-url`로 공개 URL smoke가 실행되고 앱·health·핵심 API가 응답한다. |
| 실패 | URL 누락, 비공개 URL, Azure가 아닌 로컬 터널, 404/5xx. |
| 증거 | `04-azure-smoke`, 제출 URL, `judge/reports`. |

## G4 — 100% 한국어 UI

| 항목 | 기준 |
| --- | --- |
| 통과 | 버튼, 상태, 오류, 배지, 결과 라벨이 자연스러운 한국어다. |
| 실패 | 영어 CTA, placeholder, error, demo copy가 사용자 화면에 남아 있다. |
| 증거 | `public/`, 스냅샷, `05-ui-korean`. |

## G5 — 로컬 부팅 + 핵심 액션 동작

| 항목 | 기준 |
| --- | --- |
| 통과 | `--local`이 서버를 띄우고 `GET /api/health`, `POST /api/plan`, `POST /api/assist`를 검증한다. |
| 실패 | 포트 충돌 미처리, 서버 crash, 핵심 POST 400/500, 응답 스키마 불일치. |
| 증거 | `02-local-smoke`, API 응답 JSON. |

## G6 — 시크릿 미커밋 / `.gitignore` 보호

| 항목 | 기준 |
| --- | --- |
| 통과 | 비밀 파일은 무시되고, 문서에는 placeholder만 있으며, 리포트에 시크릿 원문이 없다. |
| 실패 | 토큰·키·`.env`·`.azure`·로컬 인증 상태가 추적된다. |
| 증거 | `01-static-evidence`, `.gitignore`, git 상태. |
