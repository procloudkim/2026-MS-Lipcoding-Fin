# AI 심사 브리프 — 하루 오토파일럿 (Daily Autopilot)

> 7인 AI agent 심사위원용 1페이지. 무엇을, 왜, 어떻게 증명했는지.

## 1. 한 줄 정의

오늘의 맥락을 쏟아내면 **Copilot SDK 에이전트가 결정을 대신 내리고**(먼저/미루기/버리기),
결정된 하루 타임라인과 1순위 작업의 **첫 작업물**까지 만들어 주는 개인 생산성 웹앱.

## 2. 생산성 정의(설계 근거)

생산성 = "다음에 뭘 할지" **결정 비용**을 줄이고 실행·마무리까지 잇는 것.
→ 또 하나의 할 일 목록이 아니라 **결정 대행**으로 제품화. (피벗: ADR 0003)

## 3. P0 충족

| 제약 | 상태 | 증거 |
| --- | --- | --- |
| Copilot SDK 실제 사용 | PASS (로컬+프로덕션) | 라이브 URL `source: copilot-sdk` (토큰 인증) |
| Azure 배포 + URL | PASS | https://haru-autopilot-20260620130000.azurewebsites.net |
| 한국어/Warm Editorial/반응형 | PASS | `public/`, `img/azure-sdk-live.png` |

## 4. Copilot SDK 증거 (6/6)

| # | 종류 | 위치 |
| --- | --- | --- |
| 1 | dependency | `package.json` → `@github/copilot-sdk` (+ `@github/copilot`) |
| 2 | import | `server.js` 상단 |
| 3 | session 생성 | `server.js` `runAgent()` |
| 4 | endpoint(멀티스텝) | `POST /api/plan` + `POST /api/assist` |
| 5 | **프로덕션 SDK 응답** | 라이브 URL `source: copilot-sdk`, `authMode: token` |
| 6 | README 명시 | `README.md` |

## 5. 차별화 포인트 (왜 강한가)

- **결정 대행**: DO_NOW/SCHEDULE/DEFER/DROP/DELEGATE를 단호히 부여 + 이유. "버리기/미루기"로 결정 부담을 실제로 덜어줌.
- **작업물 생성**: 1순위 작업의 메일/안건/체크리스트/개요 초안을 즉시 생성 → 착수 마찰 0.
- **멀티스텝 에이전트**: `/api/plan` 후 `시작 도와줘`가 `/api/assist`로 추가 호출 = SDK 에이전트 강점 활용.
- **증폭 미터**: 대행 결정·생성 초안·절약 시간 가시화.
- **프로덕션 SDK**: 배포 URL이 fallback이 아니라 실제 SDK로 동작(토큰 인증 + 런타임 해석).

## 6. 검증(스모크)

- 단위: `npm run smoke` → 21 PASS
- 헬스: `GET /api/health` → `{ ok:true, authMode:"token" }`
- 계획/작업물: `/api/plan`·`/api/assist` → 프로덕션 `source: copilot-sdk`
- 브라우저: 입력→결정/타임라인/작업물 렌더(`img/azure-sdk-live.png`)

## 7. 정직한 한계

- 런타임(~500MB)로 콜드스타트가 길어 **B1 + Always On** 적용.
- 데모용 사용자 토큰을 Azure App Setting으로 주입(커밋 없음, 만료 가능).
- 영속성은 localStorage(MVP). 로그인/DB/공유는 범위 밖.
- SDK 실패 시 결정적 fallback(동일 스키마)로 가용성 유지.

## 8. 의사결정 기록

- ADR 0001: 브랜치 전략 + Azure 배포 smoke 선검증
- ADR 0002: Copilot SDK 통합 + 프로덕션 구동(토큰 인증, 런타임 해석)
- ADR 0003: 제품 피벗(정리 → 오토파일럿)
