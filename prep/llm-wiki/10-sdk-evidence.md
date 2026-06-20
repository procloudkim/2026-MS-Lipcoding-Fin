# 10 SDK Evidence — Copilot SDK 실동작 (LOCAL)

> 결론: `@github/copilot-sdk`가 로컬에서 **실제로 동작**한다. `/api/brief`가
> `source: "copilot-sdk"`로 구조화된 안전 브리프를 반환했다. (fallback 아님)

## 실행 조건 (로컬)
- Node v24.x
- 전역 설치된 GitHub Copilot CLI 런타임을 SDK가 spawn:
  - `COPILOT_CLI_PATH = C:\Users\<you>\AppData\Local\Microsoft\WinGet\Packages\GitHub.Copilot_*\copilot.exe`
- `COPILOT_MODEL = auto`

## SDK 호출 경로 (코드)
1. `package.json` → dependency `@github/copilot-sdk@^1.0.2`
2. `server.js` → `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. `getClient()` → `new CopilotClient()` + `client.start()`
4. `runAgent()` → `client.createSession({ model, onPermissionRequest: approveAll })`
5. `session.on("assistant.message")` 수집 + `session.on("session.idle")` 종료
6. `session.send({ prompt: buildBriefPrompt(query) })`
7. `normalizeBrief(parseJson(buffer))` → 구조화 JSON(BRIEF_SCHEMA)

## 실제 응답 (로컬 smoke)
- `POST /api/brief { "query": "신생아 젖병 환경호르몬 걱정" }`
  → `source: copilot-sdk`, model `auto`, ~10s, verdict `INSUFFICIENT`, evidence 4, infoGaps 5.
- `POST /api/brief { "query": "아기 물티슈 안전한 성분인지 확인" }`
  → `source: copilot-sdk`, ~8.7s, evidence 4, infoGaps 6.
- 브라우저 smoke: 입력 → "안전 브리프 생성" → 판정/연령적합성/안전축/정보간극/체크리스트/출처
  전 섹션 렌더 + 우상단 "Copilot SDK 에이전트" 배지
  ([`docs/evaluation/img/ansim-yuka-sdk-smoke.png`](../../docs/evaluation/img/ansim-yuka-sdk-smoke.png)).

## 정직성 설계
- 모델 응답은 BRIEF_SCHEMA로 강제하고, 특정 제품 시험결과를 단정하지 않도록 프롬프트로 제약.
- 응답이 스키마를 못 맞추면 `normalizeBrief`가 null → fallback(오프라인 근거 엔진)로 전환.
- 즉 **SDK 증명은 로컬 smoke**, **배포 가용성은 fallback**으로 책임 분리.
