# Oh-My-DayAuto: 2026 천하제일 입코딩 대회 출품작

> 개인 생산성 향상 웹앱입니다. 단순한 정리가 아니라 **결정 대행**을 합니다.
> 오늘의 맥락을 쏟아내면 **GitHub Copilot SDK 에이전트**가
> 무엇을 먼저 할지·미룰지·버릴지 **결정**하고, 결정된 하루 타임라인과
> 1순위 작업의 **첫 작업물(초안)** 까지 만들어 줍니다.

**[📋 PRD](PRD.md)** ·
[📐 기술 포트폴리오](docs/portfolio/00-INDEX.md) ·
[🧭 심사 브리프](docs/evaluation/AI_JUDGE_BRIEF.md) ·
[📝 ADR](docs/adr/) ·
[⚖️ 자체 심사기](judge/README.md)

`Node + Express` · `@github/copilot-sdk` · `Azure App Service` · `100% 한국어` · `helmet 보안 하드닝`

> ⚠️ 라이브 Azure URL은 **대회 종료 후 비용 절감을 위해 리소스를 삭제**했습니다.
> 아래 `npm start`로 같은 동작을 로컬에서 완전히 재현할 수 있습니다.

---

## 30초 평가 시작

```bash
npm install
npm run smoke      # 네트워크 비의존 단위 테스트 (28 PASS)
npm start          # http://localhost:3000

# (선택) 자체 게이트 점검 도구로 P0 탈락 사유 자가진단
npm run judge -- --local
```

> **자체 gate 점검(self-check)**: 제출 전에 P0 탈락 사유를 스스로 잡기 위한 도구입니다.
> 외부 공식 점수가 아니라 **자체 기준** 결과입니다. 실제 대회 평가는 대회 녹화에 남은 순위판 기준으로 **39팀 중 6위, 표시 점수 77.8점**이며, 공식 수상은 아닙니다. 평가항목 7개의 점수(5점 만점)는 사용자 경험 5, Copilot SDK 활용·생산성 영향·기능 실행·책임 있는 AI와 보안 각 4, Azure 통합·혁신 각 3이었습니다.

## 동작 재현

- 첫 화면이 곧 작업 화면입니다(랜딩 페이지가 아닙니다). 오른쪽 위 배지로 응답 출처(`Copilot SDK 에이전트` / `오프라인 결정 엔진`)를 표시합니다.
- 토큰과 런타임 없이 `npm start`를 실행하면 fallback 모드로 바로 동작하고, `COPILOT_GH_TOKEN`을 주입하면 실제 SDK 응답(`source: copilot-sdk`)을 재현합니다.

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
| **Copilot SDK 실제 사용** | ✅ PASS (로컬 + **프로덕션**) | 대회 기간 라이브 URL이 `source: "copilot-sdk"` 반환 (토큰 인증) |
| **Azure 배포 + public URL** | ✅ PASS | 대회 기간 Live URL(종료 후 삭제), 브라우저/HTTP smoke |
| 100% 한국어 / Warm Editorial / 반응형 | ✅ | `public/`, 스크린샷 |

## 무엇을 하는가 (생산성 정의)

생산성은 "다음에 뭘 할지" 정하는 **결정 비용**을 줄이고, 실행과 마무리까지 잇는 것입니다.
그래서 이 앱은 또 하나의 할 일 목록이 아니라 **결정을 대신 내려 주는 하루 운영 에이전트**입니다.

1. 맥락 입력(자유 텍스트) → 2. 에이전트가 **결정**(DO_NOW/SCHEDULE/DEFER/DELEGATE/DROP) →
3. **"지금, 이거 하나"** 히어로 + 결정된 흐름 + 1순위 작업의 **첫 작업물** →
4. `위로`/`지금으로`로 사용자가 우선순위를 조정(통제권), 각 작업 `초안 만들기`로 작업물 생성.

### 투명성 원칙 (입력 순서 ≠ 우선순위)
사용자가 적은 **입력 순서를 그대로 따르지 않습니다.** 에이전트는 **마감·영향·시간 민감도·타인 의존도**로
재정렬하고, 화면 상단 배너(`orderRationale`)에 "왜 이 순서인지"를 밝힙니다. 타임라인도 09:00에 고정하지 않고
**현재 시각(KST) 이후**의 현실적인 시간으로 배치합니다. 이렇게 해서 "내가 1번으로 적어서 1번이 된 것 아니냐"는
오해를 없앴습니다.

## Copilot SDK 증거 (6/6)

1. **dependency**: `package.json` → `@github/copilot-sdk` (+ 런타임 `@github/copilot`)
2. **import**: `server.js`: `import { CopilotClient } from "@github/copilot-sdk"`
3. **session 생성**: `runAgent()` → `client.createSession({ model, onPermissionRequest: scopedPermission })`
4. **SDK-backed endpoint**: `POST /api/plan`(결정/타임라인) + `POST /api/assist`(작업물) = **멀티스텝 에이전트**
5. **프로덕션 SDK 응답**: 라이브 URL이 `source: "copilot-sdk"`, `authMode: "token"` 반환 (대회 기간 검증)
6. **README 명시**: 본 절

## 프로덕션에서 SDK를 실행한 방법 (핵심 엔지니어링)

`@github/copilot-sdk`는 LLM HTTP API가 아니라 **로컬 Copilot CLI 런타임을 JSON-RPC로 제어**합니다.
서버나 클라우드에서 실행하려면 (1) 런타임과 (2) 비대화식 인증이 필요합니다.

- **인증**: `gh auth token` 값을 Azure App Setting `COPILOT_GH_TOKEN`으로 주입합니다. SDK는 `gitHubToken`과
  `useLoggedInUser:false`로 **토큰 인증**을 하므로 대화식 로그인이 필요 없습니다. 토큰은 **커밋하지 않습니다**.
- **런타임**: `@github/copilot`를 의존성에 추가하면 Oryx가 Azure(Linux)에 설치합니다.
  Azure의 compressed `node_modules` 레이아웃에서 SDK 기본 자동 탐색이 경로를 잘못 잡는 문제는
  `server.js`의 `resolveCliPath()`가 해결합니다. 실제 런타임 진입점 `@github/copilot/npm-loader.js`를 찾아 `COPILOT_CLI_PATH`를 설정합니다.
- 결과적으로 대회 기간의 라이브 URL에서 실제 에이전트 응답(`source: copilot-sdk`)을 확인했습니다.

자세한 내용은 [`docs/adr/0002-copilot-sdk-integration.md`](docs/adr/0002-copilot-sdk-integration.md)에 있습니다.

## 안전망(fallback)

런타임이나 인증을 쓸 수 없는 환경에서도 데모가 끊기지 않도록, SDK가 실패하면 `lib.js`의 deterministic
`fallbackPlan()/fallbackArtifact()`가 **동일 스키마**로 HTTP 200을 반환하고 화면 배지로
출처를 구분합니다. (대회 기간 프로덕션에서는 SDK가 정상 동작했습니다.)

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

기본 `npm start`는 인증이나 런타임이 없으면 deterministic fallback으로 동작합니다(데모 가용성 유지).
**로컬에서 실제 모델 응답까지 재현**하려면 (1) 비대화식 토큰과 (2) Copilot CLI 런타임을 지정합니다.

```powershell
# 1) GitHub 토큰으로 비대화식 인증 (gh CLI 로그인 상태 필요)
$env:COPILOT_GH_TOKEN = (gh auth token)
# 2) 설치된 Copilot CLI 런타임 경로 (미설정 시 resolveCliPath()가 node_modules에서 자동 탐색)
$env:COPILOT_CLI_PATH = "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Packages\GitHub.Copilot_*\copilot.exe"
$env:COPILOT_MODEL = "auto"
npm start
```

확인 방법:

```powershell
# source=copilot-sdk, authMode=token 이면 실제 SDK 경로로 동작 중
curl.exe -s -X POST http://localhost:3000/api/plan -H "Content-Type: application/json" `
  --data '{"context":"분기 보고서 마감\n고객 회신\n언젠가 정리"}'
```

> macOS/Linux에서는 `export COPILOT_GH_TOKEN=$(gh auth token)` 형식으로 똑같이 설정합니다.
> 런타임이 없거나 토큰이 만료되면 자동으로 fallback(HTTP 200, `source: fallback`)으로 전환됩니다.

## Smoke test 요약

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

- **보안 헤더**: `helmet`을 적용했습니다. CSP(스크립트 `'self'`, Pretendard CDN만 style/font 예외), HSTS,
  X-Frame-Options, X-Content-Type-Options를 설정하고 `X-Powered-By`를 제거했습니다.
- **에러 마스킹**: `/api/plan`·`/api/assist`가 실패하면 사용자에게는 일반 안내만 반환하고,
  상세 내용(스택, 내부 경로)은 서버 로그(`console.error`)에만 남깁니다. 응답에는 `detail`/`err.message`를 넣지 않습니다.
- **권한 범위 축소**: SDK 세션의 `onPermissionRequest`를 전면 승인(`approveAll`)에서
  `scopedPermission`으로 바꿨습니다. 셸 실행, 파일 쓰기, URL 접근, MCP, 확장 권한 요청은 거부하고
  무해한 요청만 1회 승인합니다(프롬프트 주입 대비).
- **진단 라우트 제거**: 런타임 경로를 파악하려고 임시로 만든 `/api/_diag`는 목적을 달성(resolveCliPath 자동화)한 뒤 삭제했습니다.
- **본문 크기 제한**: `express.json({ limit: "256kb" })`.
- 시크릿(토큰)은 코드와 문서에 하드코딩하지 않으며 `.env`/Azure App Setting으로만 주입합니다.

## 브랜치 정책

- `main`: 환경 구성/기초
- `천하제일-립코딩-2026-참전`: 대회 출품 구현
- `test`: 초기 Azure 정적 배포 smoke

## 운영 메모(정직성)

- `COPILOT_GH_TOKEN`은 Azure App Setting으로만 주입했습니다(저장소 커밋 없음). 데모용 사용자 토큰입니다.
- Azure는 **B1 + Always On**으로 런타임을 상주시켜 cold start를 줄였습니다.
- **타임아웃**: `SDK_TIMEOUT_MS` 기본값은 20초이며, 초과하면 fallback으로 전환됩니다. 런타임 cold spawn은 30초 이상 걸릴 수 있으므로, 운영 환경(Always On)에서는 App Setting으로 `SDK_TIMEOUT_MS=45000`을 권장합니다.
- **Observability(한계)**: fallback은 HTTP 200으로 반환되어 데모 가용성을 보장하지만, 운영에서는 장애가 정상처럼 묻힐 수 있습니다. 응답의 `source: fallback` 표기로 최소한의 정직성은 확보했으며, fallback 발생 횟수를 metric으로 남기는 것이 다음 개선 과제입니다.
- 보안 하드닝(helmet, 에러 마스킹, 권한 축소, 진단 라우트 제거)은 위 "보안 하드닝" 절(ADR 0005)을 참조하십시오.
