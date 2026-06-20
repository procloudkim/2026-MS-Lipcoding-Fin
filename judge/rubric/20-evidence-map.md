# 증거 맵

기준 → 증거 위치 → 검사 모듈 매핑이다. 관측되지 않은 항목은 PASS로 쓰지 않는다.

| 기준ID | 증거 파일/명령/URL | 담당 체크 모듈 | 비고 |
| --- | --- | --- | --- |
| G1 | `README.md`, `docs/evaluation/AI_JUDGE_BRIEF.md`, 로컬 핵심 액션 응답 | `01-static-evidence`, `02-local-smoke` | 개인 생산성 향상 앱이어야 함 |
| G2 | `package.json`, `server.js`, `POST /api/plan`, `POST /api/assist`, SDK source 응답 | `01-static-evidence`, `03-sdk-evidence` | 실제 엔드포인트는 `/api/plan`, `/api/assist`; `/api/copilot`은 현재 드리프트 |
| G3 | `node judge/checks/run-all.mjs --local --azure-url <URL>` | `04-azure-smoke` | Azure에서 `source=fallback`은 인증/런타임 한계 증거이지 자동 게이트 FAIL이 아님 |
| G4 | `public/`, 브라우저 스냅샷, UI 문자열 | `05-ui-korean` | 100% 한국어 UI, Warm Editorial 톤 확인 |
| G5 | `node judge/checks/run-all.mjs --local`, `GET /api/health`, `POST /api/plan`, `POST /api/assist` | `02-local-smoke` | 서버 부팅과 핵심 액션을 함께 검증 |
| G6 | `.gitignore`, git 상태, 정적 secret scan | `01-static-evidence` | `.env`, 토큰, `.azure`, 키 파일은 추적 금지 |
| productivity | 앱 설명, UI 핵심 플로우, `/api/plan` 응답 | `01-static-evidence`, `02-local-smoke` | 결정 비용 감소가 보여야 함 |
| sdk-depth | SDK 의존성, `CopilotClient`, session 생성, prompt/parse 경로 | `01-static-evidence`, `03-sdk-evidence` | dependency→import→session→endpoint 사슬 확인 |
| verification | `judge/reports/judge-report-<timestamp>.json/.md`, 실행 명령 | `run-all.mjs`, 전체 모듈 | 실패/스킵도 그대로 증거화 |
| honesty | README, AI 브리프, 리포트의 source/fallback 설명 | `01-static-evidence`, `03-sdk-evidence`, `04-azure-smoke` | 문서-코드 드리프트를 감점/수정 대상으로 기록 |
| design | `public/` CSS/HTML/JS, 한국어 상태·배지·반응형 | `05-ui-korean` | 베이지/잉크/단일 레드, 상태 표현 확인 |
| engineering | `server.js`, `lib.js`, 에러·timeout·fallback 응답 | `02-local-smoke`, `03-sdk-evidence` | 실패 시 같은 스키마로 복구하는지 확인 |
| docs | `README.md`, `docs/evaluation/AI_JUDGE_BRIEF.md`, `judge/` 문서 | `01-static-evidence` | 오래된 `/api/copilot` 언급은 알려진 함정 |

## 알려진 함정

| 함정 | 올바른 처리 |
| --- | --- |
| README/AI 브리프가 `/api/copilot`을 언급 | 실제 `server.js`에는 없음. 드리프트로 기록하고 `/api/plan`, `/api/assist` 기준으로 smoke한다. |
| Azure 응답이 `source=fallback` | 공개 URL 가용성과 SDK 라이브 응답을 분리한다. fallback 자체는 게이트 FAIL이 아니라 정직성 증거다. |
| SDK 패키지 설치만 확인 | G2 PASS 불가. import, session, endpoint, 응답 source까지 추적한다. |
| 한국어 일부만 확인 | 사용자에게 보이는 버튼/오류/상태/배지까지 확인한다. |
