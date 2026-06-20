# 10 SDK Evidence — Copilot SDK 실동작 (LOCAL)

> 결론: `@github/copilot-sdk`가 로컬에서 **실제로 동작**한다. `/api/copilot`가
> `source: "copilot-sdk"`로 구조화된 응답을 반환했다. (fallback 아님)

## 실행 조건 (로컬)
- Node v24.15.0
- 전역 설치된 GitHub Copilot CLI 런타임을 SDK가 spawn:
  - `COPILOT_CLI_PATH = ...\GitHub.Copilot_*\copilot.exe`
- `COPILOT_MODEL = auto` (런타임이 모델 자동 선택; `gpt-5`는 "not available" 거부됨)

## SDK 호출 경로 (코드)
1. `package.json` → dependency `@github/copilot-sdk@^1.0.2`
2. `server.js:4` → `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. `server.js` `getClient()` → `new CopilotClient()` + `client.start()`
4. `runWithCopilot()` → `client.createSession({ model, onPermissionRequest: approveAll })`
5. `session.on("assistant.message")` 수집 + `session.on("session.idle")` 종료
6. `session.send({ prompt: buildPrompt(text) })`
7. `parseResult(buffer)` → 구조화 JSON

## 실제 응답 (2026 본선, 로컬 smoke)
- ELAPSED_MS = 7983
- SOURCE = copilot-sdk
- MODEL = auto
- SUMMARY: 오늘은 업무 우선순위가 높은 문서 작업과 준비 업무가 중심이며, 개인 일정과 행정 확인도 함께 배치되어 있습니다.
- TOP1: 분기 보고서 초안 쓰기 — 성과와 다음 의사결정에 직접 연결되는 핵심 업무
- TOP2: 팀 회의 자료 준비 — 회의 전까지 준비가 끝나야 팀 일정이 지연되지 않음
- TOP3: 세금 서류 확인 — 기한 있는 행정 작업 가능성
- 분류: 업무 / 개인 / 행정(모델이 추론해 추가)
- 내일: 보고서 보완·구조 정리 / 회의자료 마감 / 세금 서류 누락 점검

## 평가 포인트
- "SDK를 import만 했다"가 아니라, 세션 생성→프롬프트→assistant.message→idle→JSON 파싱까지
  end-to-end로 동작함을 로컬 smoke로 증명.
- Azure에서는 런타임/인증 미보장 → fallback("오프라인 정리 모드", HTTP 200)로 가용성 유지.
  즉 **SDK 증명은 로컬, 배포 가용성은 fallback**으로 책임 분리.
