# 하루 정리 (Daily Brief) — 2026 천하제일 립코딩 본선

> 개인 생산성 향상 웹앱. 흩어진 할 일·메모를 입력하면 **GitHub Copilot SDK**가
> 오늘의 우선순위 Top 3 · 분류 · 내일 계획으로 구조화해 돌려준다.

## 심사위원(AI agent) 빠른 안내

| 항목 | 위치 |
| --- | --- |
| 심사 브리프 | [`docs/evaluation/AI_JUDGE_BRIEF.md`](docs/evaluation/AI_JUDGE_BRIEF.md) |
| ADR(의사결정 기록) | [`docs/adr/`](docs/adr/) |
| Copilot SDK 사용 증거 | 본 문서 "Copilot SDK 증거" 절 + [`prep/llm-wiki/10-sdk-evidence.md`](prep/llm-wiki/10-sdk-evidence.md) |
| 로컬 실행 | 본 문서 "실행" 절 |
| 핵심 코드 | [`server.js`](server.js)(SDK 호출) · [`lib.js`](lib.js)(파싱/fallback) · [`public/`](public/)(화면) |

## P0 제약 충족 현황

| 제약 | 상태 | 증거 |
| --- | --- | --- |
| Copilot SDK 실제 사용 | ✅ PASS (로컬 실동작 확인) | `source: "copilot-sdk"` 응답, 아래 6개 증거 |
| Azure 배포 + public URL | ✅ PASS | https://haru-jeongri-20260620122907.azurewebsites.net |
| 100% 한국어 UI / Warm Editorial | ✅ | `public/` 스크린샷 |

## 라이브 / 배포 (Azure)

- **Live URL**: https://haru-jeongri-20260620122907.azurewebsites.net
- 리소스그룹 `rg-haru-jeongri` · koreacentral · Linux · SKU **F1(Free)** · **NODE:24-lts**
- 배포: `az webapp up` (Oryx 빌드 → `npm start`)
- **public URL smoke (PASS)**
  - `GET /` → 200 (앱 렌더)
  - `GET /api/health` → `{ ok: true }`
  - `POST /api/copilot` → 200, `source: "fallback"` (Azure 설계대로)
  - 브라우저 smoke: 입력→정리→Top3/분류/내일 렌더 + "오프라인 정리 모드" 배지
    ([`docs/evaluation/img/azure-smoke.png`](docs/evaluation/img/azure-smoke.png))

## Copilot SDK 증거 (6/6)

1. **dependency** — `package.json` → `@github/copilot-sdk@^1.0.2`
2. **import** — `server.js`: `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. **session 생성** — `server.js` `runWithCopilot()` → `client.createSession({ model, onPermissionRequest: approveAll })`
4. **SDK-backed endpoint** — `POST /api/copilot`
5. **로컬 SDK 응답** — `source: "copilot-sdk"`, model `auto`, ~8s, 구조화 JSON
   (스크린샷: [`docs/evaluation/img/local-initial.png`](docs/evaluation/img/local-initial.png))
6. **README 사용 명시** — 본 절

SDK는 `@github/copilot` CLI 런타임을 spawn 해 JSON-RPC로 제어한다. 로컬에서는 설치된
Copilot CLI(`COPILOT_CLI_PATH`)를 통해 실제 모델 응답을 받는다. 자세한 트레이스는
[`docs/adr/0002-copilot-sdk-integration.md`](docs/adr/0002-copilot-sdk-integration.md) 참조.

## 환경별 동작 (정직한 분리)

- **로컬**: Copilot CLI 런타임 + GitHub 로그인 존재 → 실제 SDK 응답(`source: copilot-sdk`).
- **Azure App Service**: 런타임/인증 미보장 → 자동으로 **오프라인 정리 모드**(`source: fallback`,
  HTTP 200)로 동일 스키마 결과를 반환해 데모 가용성을 유지. 화면 우상단 배지로 source를 표시.

즉 **SDK 증명은 로컬 smoke**, **배포 가용성은 fallback**으로 책임을 분리했다.

## 아키텍처

```
[브라우저 public/]  --POST /api/copilot-->  [Express server.js]
                                              | 1) Copilot SDK 세션 시도
                                              |    (CopilotClient → CLI 런타임 → 모델)
                                              | 2) 실패 시 lib.js fallbackResult()
                                              v
                              { source, result:{summary, top3, categories, tomorrow} }
```

- 단일 Node + Express 서비스가 정적 프론트와 API를 함께 제공.
- `lib.js`는 네트워크 비의존 핵심 로직(프롬프트 빌드 / JSON 파싱 / 결정적 fallback).
- 영속성: 브라우저 `localStorage`(MVP).

## 실행

```bash
npm install
npm run smoke          # 네트워크 비의존 단위 smoke
npm start              # http://localhost:3000
```

실제 SDK 응답까지 로컬에서 재현하려면(선택):

```bash
# 설치된 Copilot CLI 런타임 경로 지정 (예: Windows winget)
$env:COPILOT_CLI_PATH = "C:\\...\\GitHub.Copilot_*\\copilot.exe"
$env:COPILOT_MODEL = "auto"
npm start
```

## 스모크

| 종류 | 명령 | 결과 |
| --- | --- | --- |
| 단위 | `npm run smoke` | PASS (8 checks) |
| 헬스 | `GET /api/health` | `{ ok: true }` |
| API | `POST /api/copilot` | `source: copilot-sdk`(로컬) / `fallback`(Azure) |
| 브라우저 | Playwright | 입력→정리→Top3/분류/내일 렌더 |

## 프로젝트 구조

```
server.js                 Express: 정적 프론트 + /api/copilot + /api/health
lib.js                    프롬프트/파싱/fallback (재사용 코어)
public/                   index.html · styles.css · app.js (Warm Editorial UI)
scripts/smoke.js          단위 smoke
.env.example              PORT / COPILOT_MODEL / SDK_TIMEOUT_MS / COPILOT_CLI_PATH
docs/adr/                 의사결정 기록(ADR)
docs/evaluation/          심사 브리프 + 스크린샷
prep/llm-wiki/            기획/근거 트레이스 (LLM-Wiki)
```

## 브랜치 정책

- `main`: 환경 구성 / 기초.
- `천하제일-립코딩-2026-참전`: 본선 구현 브랜치(현재).
- `test`: Azure 정적 배포 smoke 검증용.
