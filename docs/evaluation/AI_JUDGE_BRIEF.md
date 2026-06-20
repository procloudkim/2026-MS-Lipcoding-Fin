# AI 심사 브리프 — 하루 정리 (Daily Brief)

> 7인 AI agent 심사위원을 위한 1페이지 요약. 무엇을, 왜, 어떻게 증명했는지.

## 1. 한 줄 정의

흩어진 할 일·메모를 입력하면 Copilot SDK가 **오늘의 우선순위 Top 3 / 분류 / 내일 계획**으로
정리해 주는 개인 생산성 웹앱.

## 2. 생산성 정의(설계 근거)

생산성 = "다음에 뭘 할지" 결정 비용을 줄이고 실행·마무리까지 잇는 것.
레버 3개(명료성·집중·마무리) 중 **명료성+마무리**에 집중, 집중(타이머)은 DEFER.
(MAS Devil's Debate 결과: `prep/llm-wiki/00-event-brief.md`)

## 3. P0 제약 충족

| 제약 | 상태 | 증거 위치 |
| --- | --- | --- |
| Copilot SDK 실제 사용 | PASS | `server.js`, `prep/llm-wiki/10-sdk-evidence.md`, 본 문서 §4 |
| Azure 배포 + URL | PASS | https://haru-jeongri-20260620122907.azurewebsites.net (`img/azure-smoke.png`) |
| 한국어 / Warm Editorial | PASS | `public/`, `img/local-initial.png` |

## 4. Copilot SDK 증거 (6/6)

| # | 종류 | 위치 |
| --- | --- | --- |
| 1 | dependency | `package.json` → `@github/copilot-sdk` |
| 2 | import | `server.js` 상단 |
| 3 | session 생성 | `server.js` `runWithCopilot()` |
| 4 | endpoint | `POST /api/copilot` |
| 5 | 로컬 SDK 응답 | `source: "copilot-sdk"` (model `auto`) |
| 6 | README 명시 | `README.md` "Copilot SDK 증거" |

실제 응답 예시는 `prep/llm-wiki/10-sdk-evidence.md`에 원문 기록.

## 5. 검증(스모크)

- 단위: `npm run smoke` → PASS (8 checks)
- 헬스: `GET /api/health` → `{ ok: true }`
- API: `POST /api/copilot` → 로컬 `copilot-sdk` / Azure `fallback`
- 브라우저: Playwright로 입력→정리→렌더 확인 (`img/local-initial.png`)

## 6. 정직한 한계

- Azure에서는 SDK 런타임/인증 미보장 → 자동 fallback(HTTP 200, `source: fallback`).
  화면 배지로 source를 명확히 표시. SDK 실증은 로컬 smoke로 분리 증명.
- 영속성은 localStorage(MVP). 로그인/DB/공유/동기화는 범위 밖(DEFER/CUT).

## 7. 의사결정 기록

- ADR 0001: 브랜치 전략 + Azure 배포 smoke 선검증
- ADR 0002: Copilot SDK 통합 방식 + fallback
