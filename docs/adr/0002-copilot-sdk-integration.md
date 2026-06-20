# ADR 0002 — Copilot SDK 통합 방식과 fallback

- 상태: Accepted
- 날짜: 2026 본선
- 관련 제약: Copilot SDK 실제 사용(P0), Azure 배포(P0)

## 맥락

`@github/copilot-sdk`(v1.0.2)는 LLM HTTP API가 아니라, 로컬 **GitHub Copilot CLI 런타임을
JSON-RPC로 제어**하는 TypeScript SDK다. 즉 `CopilotClient`가 CLI 런타임 프로세스를 spawn 하고
세션을 만들어 프롬프트를 보낸다. 이 구조는 두 가지 함의를 가진다.

1. 런타임(`@github/copilot`) 실행 파일이 있어야 하고, GitHub 인증이 되어 있어야 한다.
2. 서버형 클라우드(App Service)에서는 이 런타임/인증이 기본 제공되지 않는다.

## 조사 결과 (코드 근거)

- `client.js`의 `getBundledCliPath()`는 `@github/copilot/sdk`를 resolve 하거나
  `node_modules/@github/copilot/index.js`를 찾는다. 없으면
  `resolvedCliPath = conn.path ?? COPILOT_CLI_PATH ?? getBundledCliPath()`로 결정된다.
- 런타임은 `--headless --no-auto-update --stdio|--port` 인자로 spawn 된다.
- 실행 파일이 `.js`면 `node`로, 아니면 직접 실행한다 → **설치된 `copilot.exe`를
  `COPILOT_CLI_PATH`로 지정하면 그대로 spawn 가능**.
- 세션 모델로 `gpt-5`는 "not available" 거부됨 → **`auto`**(Copilot 자동 선택)를 사용.

## 결정

1. 서버(`server.js`)는 `CopilotClient` → `createSession({ model: "auto" })` →
   `assistant.message` 수집 → `session.idle` → `parseResult()`의 정식 SDK 경로를 구현한다.
2. 런타임 경로는 `COPILOT_CLI_PATH`로 주입 가능하게 한다(로컬 재현용).
3. **fallback**: SDK 호출이 실패/타임아웃하면 `lib.js`의 결정적 `fallbackResult()`가
   동일 스키마로 HTTP 200을 반환한다. 응답에 `source`("copilot-sdk" | "fallback")를 표기하고,
   화면 배지로 노출한다.

## 결과

- **로컬 smoke에서 `source: "copilot-sdk"` 실응답 확인** (model `auto`, ~8s, 구조화 JSON).
- Azure에서는 런타임 부재 시 자동 fallback → 데모 항상 동작.
- SDK 증거(로컬)와 배포 가용성(fallback)을 분리해 양쪽 P0를 동시에 만족.

## 리스크 / 한계

- Azure에서 실제 SDK 응답은 보장하지 않는다(설계상 fallback로 처리, 정직하게 문서화).
- `COPILOT_CLI_PATH`는 머신 의존 경로이며 커밋하지 않는다(`.env.example`에 예시만).
