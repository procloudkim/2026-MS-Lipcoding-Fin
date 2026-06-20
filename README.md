# 안심육아 브리프 (Ansim-Yuka) — 2026 천하제일 립코딩

> 초보 부모를 위한 **개인 생산성 웹앱**. 육아템(제품명·우려)을 입력하면 **GitHub Copilot SDK**가
> 판매량·인기 대신 **의학·인증·환경호르몬 근거**로 _안전 판정 · 정보 간극 · 구매 전 확인 체크리스트_
> 를 구조화해 돌려준다. "조사·불안 시간"을 줄여 안전 결정을 돕는다.

> 이 앱은 같은 저장소의 "하루 정리" 프로젝트와 **분리된 워크트리/브랜치**(`안심육아-립코딩-2026`)에서
> 개발되어 기존 작업을 방해하지 않는다.

## 왜 이 앱인가 (문제)

초보 부모는 "이 육아템이 안전한가?"를 판단하려 유튜브·블로그·카페를 오래 뒤진다. 정보가
판매량/인기 위주이고, **인증 시점·기관·국가가 달라(예: 해외 시험 vs 국내 KC 인증 연도)**
정보 간극 때문에 결정을 내리지 못한다(예: 비스페놀A 검출 보도가 있는 제품). 본 앱은 그
간극과 "무엇을 어디서 확인해야 하는지"를 구조화한다.

## P0 제약 충족 현황

| 제약 | 상태 | 증거 |
| --- | --- | --- |
| Copilot SDK 실제 사용 | ✅ PASS (로컬 실동작) | `source: "copilot-sdk"` 응답 · `prep/llm-wiki/10-sdk-evidence.md` |
| Azure 배포 + public URL | ✅ PASS | http://ansim-yuka-20260620131931.azurewebsites.net · `prep/llm-wiki/20-deploy-evidence.md` |
| 100% 한국어 UI / Warm Editorial | ✅ | `public/` · 스크린샷 |

## 라이브 (Azure)

- **Live URL**: http://ansim-yuka-20260620131931.azurewebsites.net
- 리소스그룹 `rg-ansim-yuka`(하루정리와 분리) · koreacentral · Linux · F1(Free) · NODE:24-lts
- public URL smoke PASS: `GET /`=200 · `GET /api/health`=`{ok:true}` · `GET /api/categories`=6/4/8 ·
  `POST /api/brief`=200 `source:fallback`(Azure 설계대로) · 브라우저 "오프라인 근거 엔진" 배지

## 핵심 기능

- **안심 가이드 서가** (`GET /api/guide`) — 큐레이션된 안전 주제 10개를 **카드 리스트 + 카테고리 필터**로
  탐색. 카드 클릭 → **상세 모달**(체크리스트·정보간극·출처링크) → "내 상황으로 물어보기"로 AI 브리프 연결.
- `POST /api/brief` — 제품/우려 → **안전 브리프**(판정·연령적합성·안전축 근거·정보간극·체크리스트·출처).
- `GET /api/categories` — MECE 카테고리·안전축·공신력 출처 트리.
- `GET /api/health` — 헬스체크.

화면: 좌측 **안심 가이드 서가**(카드+필터+모달) · 우측 **내 상황으로 물어보기**(Copilot SDK 브리프).
육아 친화 Warm Editorial(마스코트·따뜻한 코랄 악센트·둥근 카드), 100% 한국어, 375~1920 반응형.
판정: SAFE(안심) · CAUTION(주의) · WARN(경고) · INSUFFICIENT(정보부족).
공신력 출처: 식약처 · 한국소비자원 · KC(국표원) · 대한소아청소년과학회 · 하정훈 삐뽀삐뽀119 · 맘톡TV · FDA · EU EN71.

## 정직성 (중요)

- 본 도구는 **의학적 진단·안전성 보증이 아니다.** 판정은 결정지원 정보이며 최종 확인은 공신력 출처에서.
- 특정 제품의 시험결과(BPA 검출 여부 등)를 **단정하지 않는다.** 근거가 부족하면 INSUFFICIENT로 두고
  **정보 간극**과 **확인 체크리스트**를 제시한다. (시험결과 날조 금지)

## Copilot SDK 증거 (요약)

1. dependency — `package.json` → `@github/copilot-sdk@^1.0.2`
2. import — `server.js`: `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. session — `runAgent()` → `client.createSession({ model, onPermissionRequest: approveAll })`
4. SDK-backed endpoint — `POST /api/brief`
5. 로컬 SDK 응답 — `source: "copilot-sdk"`, model `auto`, ~8~10s, 구조화 JSON
6. README 사용 명시 — 본 절

자세한 트레이스: [`prep/llm-wiki/10-sdk-evidence.md`](prep/llm-wiki/10-sdk-evidence.md).

## 환경별 동작 (정직한 분리)

- **로컬**: Copilot CLI 런타임 + GitHub 로그인 존재 → 실제 SDK 응답(`source: copilot-sdk`).
- **Azure App Service**: 런타임/인증 미보장 → 자동 **오프라인 근거 엔진**(`source: fallback`, HTTP 200)으로
  동일 스키마 결과를 반환해 데모 가용성 유지. 우상단 배지로 source 표시.

## 실행

```bash
npm install
npm run smoke          # 네트워크 비의존 단위 smoke (55 checks)
npm start              # http://localhost:3000
```

실제 SDK 응답까지 로컬 재현(선택):

```powershell
$env:COPILOT_CLI_PATH = "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Packages\GitHub.Copilot_*\copilot.exe"
$env:COPILOT_MODEL = "auto"
npm start
```

## 스모크

| 종류 | 명령 | 결과 |
| --- | --- | --- |
| 단위 | `npm run smoke` | PASS (55 checks) |
| 헬스 | `GET /api/health` | `{ ok: true, app: "ansim-yuka" }` |
| 카테고리 | `GET /api/categories` | 6 카테고리 / 4 축 / 8 출처 |
| 가이드 | `GET /api/guide` | 6 카테고리 / 10 주제(출처 URL 포함) |
| 브리프 | `POST /api/brief` | `source: copilot-sdk`(로컬) / `fallback`(Azure) |
| 브라우저 | Playwright | 카드→모달→ESC→CTA→브리프 렌더, 375/768/1280 반응형 |

## 배포 (Azure)

```bash
az webapp up --name ansim-yuka-<timestamp> --runtime "NODE:24-lts" --os-type Linux --sku F1 --location koreacentral
```

## 프로젝트 구조

```
server.js                 Express: 정적 프론트 + /api/brief + /api/guide + /api/categories + /api/health
lib.js                    seed(카테고리/축/출처/사례) + guideData + 프롬프트 + 파싱 + fallback (재사용 코어)
public/                   index.html · styles.css · app.js (육아 친화 Warm Editorial UI + 가이드 서가/모달)
scripts/smoke.js          단위 smoke (55 checks)
prep/llm-wiki/            기획/근거 트레이스 (LLM-Wiki)
research/briefs/          MECE 카테고리·안전축·공신력 출처 근거 · 데이터 흐름도/맹점
research/decisions/       악마의 토론(6R) · 디자인 방향
docs/evaluation/img/      스모크 스크린샷(redesign-*)
PLANS.md                  계획/결정 로그
```
