# 10 SDK Evidence — Copilot SDK 실동작 (로컬 + 프로덕션)

> 결론: `@github/copilot-sdk`가 **로컬과 프로덕션(Azure) 모두에서 실제로 동작**한다.
> `/api/plan`·`/api/assist`가 `source: "copilot-sdk"`로 구조화 응답을 반환(fallback 아님).

## SDK 호출 경로 (코드)
1. dependency: `@github/copilot-sdk` (+ 런타임 `@github/copilot`)
2. import: `server.js` `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. client: `new CopilotClient({ gitHubToken, useLoggedInUser:false })` + `start()`
4. session: `createSession({ model:"auto", onPermissionRequest: approveAll })`
5. stream: `assistant.message` 수집 + `session.idle` 종료
6. send: `session.send({ prompt: buildPlanPrompt|buildAssistPrompt })`
7. parse: `parseJson` → `normalizePlan|normalizeArtifact`

## 인증 (비대화식)
- `gh auth token` 값을 `COPILOT_GH_TOKEN`으로 주입 → 토큰 인증(로그인 불필요).
- 로컬 실측: 대화식 로그인 없이 세션 생성·응답 성공.
- Azure: App Setting `COPILOT_GH_TOKEN`(커밋 금지). `authMode: token` 확인.

## 모델
- `gpt-5`는 런타임이 거부("not available") → `auto` 사용.

## 실응답 (프로덕션, Azure 라이브)
- `/api/plan` → `source: copilot-sdk`, `authMode: token`, ~31s(콜드 spawn)
  - 예) headline "오늘은 회신과 보고서부터 끝내고, 나머지는 시간표에 넣고 과감히 미룬다."
  - decisions: 분기보고서[DO_NOW], 고객 회신[DO_NOW], 회의자료[SCHEDULE], 운동[SCHEDULE], 부모님전화[SCHEDULE], 세금[DEFER], 사이드[DROP]
  - firstArtifact: 문서개요/이메일 초안 자동 생성
- `/api/assist` → `source: copilot-sdk` (회의 안건/보고 체크리스트 등 생성)
- 스크린샷: `docs/evaluation/img/azure-sdk-live.png`

## 런타임 해석 (Azure)
- Oryx compressed node_modules + 중첩 설치로 SDK 기본 자동탐색이 경로를 잘못 잡음.
- `server.js` `resolveCliPath()`가 실제 진입점 `@github/copilot/npm-loader.js`를 찾아
  `COPILOT_CLI_PATH` 설정 → 런타임 spawn 성공. (`/api/_diag`로 실측)

## 평가 포인트
- import만이 아니라 세션→프롬프트→스트리밍→파싱까지 end-to-end.
- **배포 URL이 실제 SDK로 동작**(fallback 아님). 멀티스텝(plan+assist)로 에이전트성 입증.
