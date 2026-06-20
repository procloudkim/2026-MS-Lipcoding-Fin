# 하루 오토파일럿 (Daily Autopilot) — 2026 천하제일 립코딩 본선

> 개인 생산성 향상 웹앱. 단순 정리가 아니라 **결정 대행**.
> 오늘의 맥락을 쏟아내면 **GitHub Copilot SDK 에이전트**가
> 무엇을 먼저 할지·미룰지·버릴지 **결정**하고, 결정된 하루 타임라인과
> 1순위 작업의 **첫 작업물(초안)** 까지 만들어 준다.

**[🔗 라이브 데모](https://haru-autopilot-20260620130000.azurewebsites.net)** ·
[📋 PRD](PRD.md) ·
[🧭 심사 브리프](docs/evaluation/AI_JUDGE_BRIEF.md) ·
[📝 ADR](docs/adr/) ·
[⚖️ 자체 심사기](judge/README.md)

`Node + Express` · `@github/copilot-sdk` · `Azure App Service(B1)` · `100% 한국어` · `helmet 보안 하드닝`

---

## 🚀 30초 평가 시작

```bash
npm install
npm run smoke      # 네트워크 비의존 단위 테스트 (28 PASS)
npm start          # http://localhost:3000

# (선택) 자체 심사기로 게이트/점수/보안 자동 채점
npm run judge -- --local --azure-url https://haru-autopilot-20260620130000.azurewebsites.net
```

> **자체 심사 결과**: `READY · 100/100 · 보안 A+(발견 0) · P0 게이트 7/7 PASS`
> (로컬 SDK 토큰 재현 시 100점, 토큰 없이도 98점·보안 A+·7/7 동일. 상세: [`docs/adr/0005-security-hardening.md`](docs/adr/0005-security-hardening.md))

## ▶ 라이브

- **Live URL**: https://haru-autopilot-20260620130000.azurewebsites.net
- 첫 화면이 곧 작업 화면(랜딩 아님). 우상단 배지로 응답 출처(`Copilot SDK 에이전트` / `오프라인 결정 엔진`)를 표시.

## 심사위원(AI agent) 빠른 안내

| 항목 | 위치 |
| --- | --- |
| 제품 정의서(PRD) | [`PRD.md`](PRD.md) |
| 심사 브리프(1p) | [`docs/evaluation/AI_JUDGE_BRIEF.md`](docs/evaluation/AI_JUDGE_BRIEF.md) |
| 의사결정 기록(ADR) | [`docs/adr/`](docs/adr/) (0001 브랜치·0002 SDK·0003 피벗·0004 UX·0005 보안) |
| 자체 심사기(증거 자동수집) | [`judge/README.md`](judge/README.md) · `npm run judge` |
| SDK 사용 증거 | 본 문서 §"Copilot SDK 증거" + [`prep/llm-wiki/10-sdk-evidence.md`](prep/llm-wiki/10-sdk-evidence.md) |
| 배포 증거 | [`prep/llm-wiki/20-deploy-evidence.md`](prep/llm-wiki/20-deploy-evidence.md) |
| 핵심 코드 | [`server.js`](server.js)(SDK 에이전트·런타임 해석·KST·보안) · [`lib.js`](lib.js)(프롬프트/정렬/파싱/fallback) · [`public/`](public/)(UI) |
| 스크린샷 | [`docs/evaluation/img/azure-sdk-live.png`](docs/evaluation/img/azure-sdk-live.png)(프로덕션 SDK), `local-redesign.png`(재설계 UI) |

## P0 제약 충족 현황

| 제약 | 상태 | 증거 |
| --- | --- | --- |
| **Copilot SDK 실제 사용** | ✅ PASS (로컬 + **프로덕션**) | 라이브 URL이 `source: "copilot-sdk"` 반환 (토큰 인증) |
| **Azure 배포 + public URL** | ✅ PASS | 위 Live URL, 브라우저/HTTP smoke |
| 100% 한국어 / Warm Editorial / 반응형 | ✅ | `public/`, 스크린샷 |

## 무엇을 하는가 (생산성 정의)

생산성 = "다음에 뭘 할지" **결정 비용**을 줄이고 실행·마무리까지 잇는 것.
그래서 이 앱은 또 하나의 할 일 목록이 아니라, **결정을 대신 내려주는 하루 운영 에이전트**다.

1. 맥락 입력(자유 텍스트) → 2. 에이전트가 **결정**(DO_NOW/SCHEDULE/DEFER/DELEGATE/DROP) →
3. **"지금, 이거 하나"** 히어로 + 결정된 흐름 + 1순위 작업의 **첫 작업물** →
4. `위로`/`지금으로`로 사용자가 우선순위를 조정(통제권), 각 작업 `초안 만들기`로 작업물 생성.

### 투명성 원칙 (입력 순서 ≠ 우선순위)
사용자가 적은 **입력 순서를 그대로 따르지 않는다.** 에이전트는 **마감·영향·시간 민감도·타인 의존도**로
재정렬하고, 화면 상단 배너(`orderRationale`)에 "왜 이 순서인지"를 명시한다. 타임라인도 고정 09:00이
아니라 **현재 시각(KST) 이후**의 현실적 시간으로 배치한다. → "내가 1번으로 적어서 1번이 된 것 아니냐"는
오해를 제거.

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
npm run smoke      # 네트워크 비의존 단위 smoke (28 checks)
npm start          # http://localhost:3000
```

### 로컬에서 실제 SDK 응답(source=copilot-sdk) 재현

기본 `npm start`는 인증/런타임이 없으면 결정적 fallback으로 동작한다(데모 가용성 유지).
**로컬에서 실제 모델 응답까지 재현**하려면 (1) 비대화식 토큰 + (2) Copilot CLI 런타임을 지정한다:

```powershell
# 1) GitHub 토큰으로 비대화식 인증 (gh CLI 로그인 상태 필요)
$env:COPILOT_GH_TOKEN = (gh auth token)
# 2) 설치된 Copilot CLI 런타임 경로 (미설정 시 resolveCliPath()가 node_modules에서 자동 탐색)
$env:COPILOT_CLI_PATH = "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Packages\GitHub.Copilot_*\copilot.exe"
$env:COPILOT_MODEL = "auto"
npm start
```

확인:

```powershell
# source=copilot-sdk, authMode=token 이면 실제 SDK 경로로 동작 중
curl.exe -s -X POST http://localhost:3000/api/plan -H "Content-Type: application/json" `
  --data '{"context":"분기 보고서 마감\n고객 회신\n언젠가 정리"}'
```

> macOS/Linux는 `export COPILOT_GH_TOKEN=$(gh auth token)` 형식으로 동일하게 설정한다.
> 런타임이 없거나 토큰이 만료되면 자동으로 fallback(HTTP 200, `source: fallback`)으로 전환된다.

## 스모크 요약

| 종류 | 명령/행위 | 결과 |
| --- | --- | --- |
| 단위 | `npm run smoke` | PASS (28) |
| 헬스 | `GET /api/health` | `{ ok:true, authMode:"token" }` |
| 계획 | `POST /api/plan` | 프로덕션 `source: copilot-sdk` |
| 작업물 | `POST /api/assist` | `source: copilot-sdk` |
| 브라우저 | 입력→실행→결정/타임라인/작업물 | PASS (스크린샷) |

## 프로젝트 구조

```
server.js                Express+helmet: 정적 + /api/plan + /api/assist + /api/health (+ resolveCliPath, scopedPermission)
lib.js                   프롬프트/파서/normalize/결정적 fallback (재사용 코어)
public/                  index.html · styles.css · app.js (Warm Editorial UI)
scripts/smoke.js         단위 smoke (28 checks)
.env.example             PORT / COPILOT_MODEL / SDK_TIMEOUT_MS / COPILOT_GH_TOKEN / COPILOT_CLI_PATH
PRD.md                   제품 정의서(Source of Truth)
judge/                   자체 심사기(게이트·점수·보안 자동 채점) — npm run judge
docs/adr/                ADR 0001(브랜치/배포) · 0002(SDK) · 0003(피벗) · 0004(UX) · 0005(보안)
docs/evaluation/         심사 브리프 + 스크린샷
prep/llm-wiki/           기획/근거 트레이스 (LLM-Wiki)
```

## 보안 하드닝

- **보안 헤더**: `helmet` 적용 — CSP(스크립트 `'self'`, Pretendard CDN만 style/font 예외), HSTS,
  X-Frame-Options, X-Content-Type-Options. `X-Powered-By` 제거.
- **에러 마스킹**: `/api/plan`·`/api/assist`의 실패는 사용자에게 일반 안내만 반환하고
  상세(스택/내부 경로)는 서버 로그(`console.error`)로만 남긴다. 응답에 `detail`/`err.message` 미포함.
- **권한 범위 축소**: SDK 세션 `onPermissionRequest`를 전면 승인(`approveAll`)에서
  `scopedPermission`으로 교체 — 셸 실행/파일 쓰기/URL 접근/MCP/확장 권한 요청은 거부하고
  무해한 요청만 1회 승인(프롬프트 주입 대비).
- **진단 라우트 제거**: 런타임 경로 파악용 임시 `/api/_diag`는 목적 달성(resolveCliPath 자동화) 후 삭제.
- **본문 크기 제한**: `express.json({ limit: "256kb" })`.
- 시크릿(토큰)은 코드/문서에 하드코딩하지 않으며 `.env`/Azure App Setting으로만 주입.

## 브랜치 정책

- `main`: 환경 구성/기초
- `천하제일-립코딩-2026-참전`: 본선 구현(현재)
- `test`: 초기 Azure 정적 배포 smoke

## 운영 메모(정직성)

- `COPILOT_GH_TOKEN`은 Azure App Setting으로만 주입(레포 커밋 없음). 데모용 사용자 토큰.
- Azure는 **B1**(Always On)로 런타임을 상주시켜 콜드스타트를 줄였다.
- 보안 하드닝(helmet/에러 마스킹/권한 축소/진단 라우트 제거)은 위 "보안 하드닝" 절 참조(ADR 0005).
