# PRD — Oh-My-DayAuto

> 2026 천하제일 립코딩 본선 제출용 제품 요구사항 문서(Source of Truth).
> 본 문서는 앱의 목적·범위·동작·검증의 기준이며, 실제 코드(`server.js`, `lib.js`, `public/`)와 일치한다.

## 1. 한 줄 정의

흩어진 오늘의 맥락(할 일·메모)을 입력하면 **GitHub Copilot SDK**가 **오늘의 결정(우선순위)·타임라인·바로 쓸 첫 작업물**로 구조화해 돌려주는 **개인 생산성 향상 웹앱**.

- 카테고리: 개인 생산성 향상 웹앱
- 가치: "다음에 무엇을 할지" 결정 비용을 줄이고, 실행·마무리까지 잇는다.

## 2. 문제 / 사용자

- **사용자**: 할 일과 맥락이 여러 곳에 흩어져 "무엇을 먼저 할지" 결정에 에너지를 쓰는 직장인·학생.
- **문제**: 정리·우선순위·첫 착수가 분리되어 있어, 결정과 시작에 마찰이 크다.
- **효과(측정)**: 수동으로 우선순위를 정리·재배치하는 5~10분을, **1회 입력 후 약 10~30초**의 에이전트 응답으로 대체한다(오늘의 결정 1개 + 타임라인 + 첫 작업물).
- **범위 제외(now)**: 팀 협업, 멀티 디바이스 동기화, 로그인/DB.

## 3. 핵심 기능 (실제 엔드포인트 기준)

| 기능 | 엔드포인트 | 입력 → 출력 |
| --- | --- | --- |
| 헬스체크 | `GET /api/health` | `{ ok: true, app, model, authMode }` |
| 하루 정리(핵심) | `POST /api/plan` | `context` → `plan{ headline, decisions[verdict·why·when], timeline, firstArtifact, amplify }` |
| 작업물 생성 | `POST /api/assist` | `task`,`type` → `artifact{ type, title, content }` (메일/안건/체크리스트/개요/메시지) |

- 결정 verdict: `DO_NOW · SCHEDULE · DEFER · DROP · DELEGATE` (한국어 라벨 부여).
- 화면: 좌측 맥락 입력 → 우측 결정·타임라인·첫 작업물 렌더, 응답 `source` 배지 표기.
- UI: 100% 한국어, Warm Editorial(베이지·잉크·단일 레드 액센트), 375~1920 반응형.

## 4. Copilot SDK 사용 (추적 가능)

1. dependency — `package.json` → `@github/copilot-sdk@^1.0.2` (+ 런타임 `@github/copilot`)
2. import — `server.js`: `import { CopilotClient } from "@github/copilot-sdk"`
3. session — `runAgent()` → `client.createSession({ model, onPermissionRequest: scopedPermission })`
4. 호출 — `session.send({ prompt })` + `assistant.message` 수집 + `session.idle` 종료
5. SDK-backed endpoint — `POST /api/plan`, `POST /api/assist`
6. 정직한 source 표기 — 응답 `source: "copilot-sdk" | "fallback"`를 화면 배지로 노출

> 권한 핸들러는 전면 승인이 아니라 `scopedPermission`으로, 셸/파일/URL/MCP/확장 권한 요청을 거부하고 무해한 요청만 1회 승인한다(프롬프트 주입 방어, ADR 0005).
> SDK는 `@github/copilot` CLI 런타임을 spawn 해 JSON-RPC로 제어한다. 자세한 트레이스는 `docs/adr/0002-copilot-sdk-integration.md` 참조.

## 5. Azure 배포 (필수)

- **Live URL (대회 기간)**: `https://oh-my-dayauto-20260620130000.azurewebsites.net` — *대회 종료 후 비용 절감을 위해 리소스 삭제됨. 로컬 `npm start`로 동일 재현.*
- 리소스그룹 `rg-haru-jeongri` · koreacentral · Linux · NODE:24-lts · `az webapp up`(Oryx)
- **SKU 히스토리**: 초기 F1(Free)로 정적 배포 검증 → 최종 **B1(Basic) + Always On** (Copilot 런타임 ~500MB 콜드스타트 완화).
- **public URL smoke (대회 기간 검증됨)**
  - `GET /` → 200 (한국어 앱 렌더)
  - `GET /api/health` → `{ ok: true, authMode: "token" }`
  - `POST /api/plan` → 200, **`source: "copilot-sdk"`** (서버 토큰 인증으로 Azure에서도 실제 모델 응답)

## 6. 환경별 동작 (정직한 분리)

- **로컬**: Copilot CLI 런타임 + 로그인/토큰 → `source: copilot-sdk`(실제 모델 응답).
- **Azure App Service**: 서버 GitHub 토큰(앱 설정, 리포 미포함) 사용 시 `source: copilot-sdk`, 미보장 환경에서는 자동 **오프라인 결정 엔진**(`source: fallback`, HTTP 200)으로 동일 스키마 유지.
- 화면 우상단 배지로 source를 항상 표기한다.

## 7. 아키텍처 / 스택

```
[브라우저 public/] --POST /api/plan|assist--> [Express server.js]
                                                | 1) Copilot SDK 세션(runAgent)
                                                | 2) 실패 시 lib.js fallback(결정적)
                                                v  { source, plan|artifact }
```

- 단일 Node + Express가 정적 프론트와 API를 함께 제공(빌드 단계 없음 → Azure 단순 배포).
- `lib.js`: 네트워크 비의존 코어(프롬프트 빌드 · JSON 파싱 · 정규화 · 결정적 fallback).
- 영속성: 브라우저 `localStorage`(MVP).

## 8. 실행 / 검증

```bash
npm install
npm run smoke      # 네트워크 비의존 단위 smoke (lib.js 코어)
npm start          # http://localhost:3000
```

- 단위 smoke: `npm run smoke` PASS
- API smoke: `GET /api/health` → ok, `POST /api/plan` → 구조화 응답(로컬 copilot-sdk)
- 브라우저 smoke: 입력 → 정리 → 결정/타임라인/첫 작업물 렌더 + source 배지

## 9. 정직성 / 한계

- 영속성은 localStorage(MVP). 로그인/DB/공유/동기화는 범위 밖.
- SDK 미가용 환경에서는 fallback으로 가용성을 유지하되 `source`로 정직하게 구분 표기한다.

## 10. 제출 메타

| 항목 | 값 |
| --- | --- |
| 앱 제목 | Oh-My-DayAuto (Oh-My-DayAuto) |
| 리포지토리 | https://github.com/procloudkim/2026-MS-Lipcoding-Fin |
| 브랜치 | `천하제일-립코딩-2026-참전` |
| 배포 URL | https://oh-my-dayauto-20260620130000.azurewebsites.net |
| 실행 명령 | `npm install && npm start` |
