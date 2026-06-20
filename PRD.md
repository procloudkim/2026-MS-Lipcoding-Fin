# PRD — 안심육아 브리프 (Ansim-Yuka)

> 2026 천하제일 립코딩 본선 제출용 제품 요구사항 문서(Source of Truth).
> 본 문서는 앱의 목적·범위·동작·검증의 기준이며, 실제 코드(`server.js`, `lib.js`, `public/`)와 일치한다.

## 1. 한 줄 정의

초보 부모가 육아템(제품명·우려)을 입력하면 **GitHub Copilot SDK**가 판매량·인기 대신 **의학·인증·환경호르몬 등 공신력 근거**로 **안전 판정 · 정보 간극 · 구매 전 확인 체크리스트**를 구조화해 돌려주는 **개인 생산성 향상 웹앱**.

- 카테고리: 개인 생산성 향상 웹앱
- 가치: 육아템 안전성 "조사·불안 시간"을 줄여 안전 결정을 돕는다.

## 2. 문제 / 사용자

- **사용자**: 육아템 안전성을 판단하려 유튜브·블로그·카페를 오래 뒤지는 초보 부모.
- **문제**: 정보가 판매량/인기 위주이고, 인증 시점·기관·국가가 달라(예: 해외 시험 vs 국내 KC 인증 연도) **정보 간극** 때문에 결정을 못 내린다.
- **범위 제외(now)**: 의학적 진단, 특정 제품 시험결과 단정, 로그인/DB.

## 3. 핵심 기능 (실제 엔드포인트 기준)

| 기능 | 엔드포인트 | 입력 → 출력 |
| --- | --- | --- |
| 헬스체크 | `GET /api/health` | `{ ok: true, app, model, authMode }` |
| 카테고리 트리 | `GET /api/categories` | MECE 카테고리 · 안전축 · 공신력 출처 |
| 안심 가이드 서가 | `GET /api/guide` | 큐레이션 안전 주제(카드+필터+상세 모달) |
| 안전 브리프(핵심) | `POST /api/brief` | `query`(또는 `text`) → `brief{ verdict, 연령적합성, 안전축 근거, 정보간극, 체크리스트, 출처 }` |

- 판정 verdict: `SAFE(안심) · CAUTION(주의) · WARN(경고) · INSUFFICIENT(정보부족)`.
- 화면: 좌측 **안심 가이드 서가**(카드·필터·모달) + 우측 **내 상황으로 물어보기**(Copilot SDK 브리프).
- 공신력 출처: 식약처 · 한국소비자원 · KC(국표원) · 대한소아청소년과학회 · 하정훈 삐뽀삐뽀119 · 맘톡TV · FDA · EU EN71.
- UI: 100% 한국어, 육아 친화 Warm Editorial(마스코트·코랄 악센트·둥근 카드), 375~1920 반응형.

## 4. Copilot SDK 사용 (추적 가능)

1. dependency — `package.json` → `@github/copilot-sdk@^1.0.2`
2. import — `server.js`: `import { CopilotClient, approveAll } from "@github/copilot-sdk"`
3. session — `runAgent()` → `client.createSession({ model, onPermissionRequest: approveAll })`
4. 호출 — `session.send({ prompt })` + `assistant.message` 수집 + `session.idle` 종료
5. SDK-backed endpoint — `POST /api/brief`
6. 정직한 source 표기 — 응답 `source: "copilot-sdk" | "fallback"`를 화면 배지로 노출

> 자세한 트레이스: `prep/llm-wiki/10-sdk-evidence.md`.

## 5. Azure 배포 (필수)

- **Live URL**: https://ansim-yuka-20260620131931.azurewebsites.net
- 리소스그룹 `rg-ansim-yuka`(하루정리와 분리) · koreacentral · Linux · F1(Free) · NODE:24-lts · `az webapp up`
- **public URL smoke (검증됨)**
  - `GET /` → 200 (한국어 앱 렌더)
  - `GET /api/health` → `{ ok: true }`
  - `GET /api/categories` → 카테고리/안전축/출처 트리
  - `POST /api/brief` → 200, `source: "fallback"`(Azure 런타임 미보장 설계대로, verdict 예: CAUTION)

## 6. 환경별 동작 (정직한 분리)

- **로컬**: Copilot CLI 런타임 + 로그인 → `source: copilot-sdk`(실제 모델 응답).
- **Azure App Service**: 런타임/인증 미보장 → 자동 **오프라인 근거 엔진**(`source: fallback`, HTTP 200)으로 동일 스키마 유지. 화면 배지로 source 표기.

## 7. 아키텍처 / 스택

```
[브라우저 public/] --POST /api/brief--> [Express server.js]
                                          | 1) Copilot SDK 세션(runAgent)
                                          | 2) 실패 시 lib.js fallback(결정적 근거 엔진)
                                          v  { source, brief{verdict, 근거, 정보간극, 체크리스트, 출처} }
```

- 단일 Node + Express가 정적 프론트와 API를 함께 제공(빌드 단계 없음 → Azure 단순 배포).
- `lib.js`: 네트워크 비의존 코어(큐레이션 시드 · 안전축 근거 · 브리프 빌드/파싱/fallback).
- 영속성: 브라우저 `localStorage`(MVP).

## 8. 실행 / 검증

```bash
npm install
npm run smoke      # 네트워크 비의존 단위 smoke (lib.js 코어)
npm start          # http://localhost:3000
```

- API smoke: `GET /api/health` → ok, `GET /api/categories` → 트리, `POST /api/brief` → 구조화 브리프
- 브라우저 smoke: 가이드 서가 탐색 → 모달 → "내 상황으로 물어보기" → 브리프 렌더 + source 배지

## 9. 정직성 / 한계 (중요)

- 본 도구는 **의학적 진단·안전성 보증이 아니다.** 판정은 결정지원 정보이며 최종 확인은 공신력 출처에서.
- 특정 제품 시험결과(BPA 검출 여부 등)를 **단정하지 않는다.** 근거가 부족하면 `INSUFFICIENT`로 두고 **정보 간극**과 **확인 체크리스트**를 제시한다. (시험결과 날조 금지)

## 10. 제출 메타

| 항목 | 값 |
| --- | --- |
| 앱 제목 | 안심육아 브리프 (Ansim-Yuka) |
| 리포지토리 | https://github.com/procloudkim/2026-MS-Lipcoding-Fin |
| 브랜치 | `안심육아-립코딩-2026` |
| 배포 URL | https://ansim-yuka-20260620131931.azurewebsites.net |
| 실행 명령 | `npm install && npm start` |
