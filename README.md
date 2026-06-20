# 하루 오토파일럿 (Daily Autopilot) — 2026 천하제일 립코딩 본선

> 개인 생산성 향상 웹앱. 단순 정리가 아니라 **결정 대행**.
> 오늘의 맥락을 쏟아내면 **GitHub Copilot SDK 에이전트**가
> 무엇을 먼저 할지·미룰지·버릴지 **결정**하고, 결정된 하루 타임라인과
> 1순위 작업의 **첫 작업물(초안)** 까지 만들어 준다.

## ▶ 라이브

- **Live URL**: https://haru-autopilot-20260620130000.azurewebsites.net
- 첫 화면이 곧 작업 화면(랜딩 아님). 우상단 배지로 응답 출처(`Copilot SDK 에이전트` / `오프라인 결정 엔진`)를 표시.

## 심사위원(AI agent) 빠른 안내

| 항목 | 위치 |
| --- | --- |
| 심사 브리프(1p) | [`docs/evaluation/AI_JUDGE_BRIEF.md`](docs/evaluation/AI_JUDGE_BRIEF.md) |
| 의사결정 기록(ADR) | [`docs/adr/`](docs/adr/) |
| SDK 사용 증거 | 본 문서 §"Copilot SDK 증거" + [`prep/llm-wiki/10-sdk-evidence.md`](prep/llm-wiki/10-sdk-evidence.md) |
| 배포 증거 | [`prep/llm-wiki/20-deploy-evidence.md`](prep/llm-wiki/20-deploy-evidence.md) |
| 핵심 코드 | [`server.js`](server.js)(SDK 에이전트) · [`lib.js`](lib.js)(프롬프트/파싱/fallback) · [`public/`](public/)(UI) |
| 스크린샷 | [`docs/evaluation/img/azure-sdk-live.png`](docs/evaluation/img/azure-sdk-live.png)(프로덕션 SDK), `local-autopilot.png`(로컬) |

## P0 제약 충족 현황

| 제약 | 상태 | 증거 |
| --- | --- | --- |
| **Copilot SDK 실제 사용** | ✅ PASS (로컬 + **프로덕션**) | 라이브 URL이 `source: "copilot-sdk"` 반환 (토큰 인증) |
| **Azure 배포 + public URL** | ✅ PASS | 위 Live URL, 브라우저/HTTP smoke |
| 100% 한국어 / Warm Editorial / 반응형 | ✅ | `public/`, 스크린샷 |

## 무엇을 하는가 (생산성 정의)

생산성 = "다음에 뭘 할지" **결정 비용**을 줄이고 실행·마무리까지 잇는 것.
그래서 이 앱은 또 하나의 할 일 목록이 아니라, **결정을 대신 내려주는 하루 운영 에이전트**다.

1. 맥락 입력(자유 텍스트) → 2. 에이전트가 **결정**(DO_NOW/SCHEDULE/DEFER/DROP/DELEGATE) →
3. **결정된 하루** 타임라인 + 1순위 작업의 **첫 작업물** 생성 →
4. 각 작업의 `시작 도와줘`로 추가 작업물(메일/안건/체크리스트) 즉시 생성.

## Copilot SDK 증거 (6/6)

1. **dependency** — `package.json` → `@github/copilot-sdk` (+ 런타임 `@github/copilot`)
2. **import** — `server.js`: `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. **session 생성** — `runAgent()` → `client.createSession({ model, onPermissionRequest: approveAll })`
4. **SDK-backed endpoint** — `POST /api/plan`(결정/타임라인) + `POST /api/assist`(작업물) = **멀티스텝 에이전트**
5. **프로덕션 SDK 응답** — 라이브 URL이 `source: "copilot-sdk"`, `authMode: "token"` 반환
6. **README 명시** — 본 절

## 어떻게 프로덕션에서 SDK가 도는가 (핵심 엔지니어링)

`@github/copilot-sdk`는 LLM HTTP API가 아니라 **로컬 Copilot CLI 런타임을 JSON-RPC로 제어**한다.
서버/클라우드에서 돌리려면 (1) 런타임 존재 + (2) 비대화식 인증이 필요하다.

- **인증**: `gh auth token` 값을 Azure App Setting `COPILOT_GH_TOKEN`으로 주입 →
  SDK가 `gitHubToken` + `useLoggedInUser:false`로 **토큰 인증**(대화식 로그인 불필요). 토큰은 **커밋하지 않음**.
- **런타임**: `@github/copilot`를 의존성에 추가 → Oryx가 Azure(Linux)에 설치.
  Azure의 compressed `node_modules` 레이아웃에서 SDK 기본 자동탐색이 경로를 잘못 잡는 문제를
  `server.js`의 `resolveCliPath()`가 흡수(실제 런타임 진입점 `@github/copilot/npm-loader.js`를 찾아 `COPILOT_CLI_PATH` 설정).
- 결과: 라이브 URL에서 실제 에이전트 응답(`source: copilot-sdk`).

자세한 내용: [`docs/adr/0002-copilot-sdk-integration.md`](docs/adr/0002-copilot-sdk-integration.md).

## 안전망(fallback)

런타임/인증이 불가한 환경에서도 데모가 끊기지 않도록, SDK 실패 시 `lib.js`의 결정적
`fallbackPlan()/fallbackArtifact()`가 **동일 스키마**로 HTTP 200을 반환하고 화면 배지로
출처를 구분한다. (현재 프로덕션은 SDK 정상 동작.)

## 아키텍처

```
[브라우저 public/]
   │  POST /api/plan        (맥락 → 결정/타임라인/첫 작업물)
   │  POST /api/assist      (작업 → 메일/안건/체크리스트)
   ▼
[Express server.js] ── Copilot SDK 세션(CopilotClient → CLI 런타임 → 모델, 토큰 인증)
   │  실패 시 ▼
   └── lib.js fallback (결정적 결정 엔진)
응답: { source, plan|artifact }   ·   영속: 브라우저 localStorage
```

## 실행

```bash
npm install
npm run smoke      # 네트워크 비의존 단위 smoke (21 checks)
npm start          # http://localhost:3000
```

로컬에서 실제 SDK 응답까지 재현(선택):

```powershell
$env:COPILOT_GH_TOKEN = (gh auth token)        # 토큰 인증
$env:COPILOT_CLI_PATH = "C:\...\GitHub.Copilot_*\copilot.exe"  # 설치된 CLI 런타임
$env:COPILOT_MODEL = "auto"
npm start
```

## 스모크 요약

| 종류 | 명령/행위 | 결과 |
| --- | --- | --- |
| 단위 | `npm run smoke` | PASS (21) |
| 헬스 | `GET /api/health` | `{ ok:true, authMode:"token" }` |
| 계획 | `POST /api/plan` | 프로덕션 `source: copilot-sdk` |
| 작업물 | `POST /api/assist` | `source: copilot-sdk` |
| 브라우저 | 입력→실행→결정/타임라인/작업물 | PASS (스크린샷) |

## 프로젝트 구조

```
server.js                Express: 정적 + /api/plan + /api/assist + /api/health (+ resolveCliPath)
lib.js                   프롬프트/파서/normalize/결정적 fallback (재사용 코어)
public/                  index.html · styles.css · app.js (Warm Editorial UI)
scripts/smoke.js         단위 smoke (21 checks)
.env.example             PORT / COPILOT_MODEL / SDK_TIMEOUT_MS / COPILOT_GH_TOKEN / COPILOT_CLI_PATH
docs/adr/                ADR 0001(브랜치/배포) · 0002(SDK) · 0003(피벗)
docs/evaluation/         심사 브리프 + 스크린샷
prep/llm-wiki/           기획/근거 트레이스 (LLM-Wiki)
```

## 브랜치 정책

- `main`: 환경 구성/기초
- `천하제일-립코딩-2026-참전`: 본선 구현(현재)
- `test`: 초기 Azure 정적 배포 smoke

## 운영 메모(정직성)

- `COPILOT_GH_TOKEN`은 Azure App Setting으로만 주입(레포 커밋 없음). 데모용 사용자 토큰.
- Azure는 **B1**(Always On)로 런타임을 상주시켜 콜드스타트를 줄였다.
- `GET /api/_diag?key=...`는 런타임 경로 진단용(비밀 미노출). 운영 보조 용도.
