# 00 Event Brief — 안심육아 브리프 (Lipcoding 2026)

> 상위 과제: 개인 생산성 향상 웹앱 / Copilot SDK 필수 / Azure 배포 필수.
> 본 앱은 기존 "하루 정리" 프로젝트와 **분리된 워크트리/브랜치**(`안심육아-립코딩-2026`)에서 진행한다.

## 생산성 정의 (locked)

생산성 증진 = **흩어진 조사를 구조화해 "이 육아템이 안전한가"라는 결정 비용과 불안 시간을 줄이는 것.**
"더 많이 검색하기"가 아니라 "신뢰할 수 있는 근거로 빠르게 결정하기".

3 레버:
- Clarity(명료성): 무엇이 안전 쟁점인지 한눈에.
- Trust(신뢰): 판매량/인기 대신 공신력 출처 기반.
- Closure(마무리): 구매 전 확인 체크리스트로 행동까지 연결.

MVP는 **Clarity + Trust + Closure**를 한 화면(브리프)으로 잇는다.

## Problem

초보 부모는 육아템(젖병·쪽쪽이·물티슈 등) 구매 시 "안전한가?"를 판단하기 위해
유튜브·블로그·카페에 흩어진 정보를 오래 뒤진다. 정보가 판매량/인기 위주이고,
인증 시점·기관·국가가 달라 **정보 간극** 때문에 결정을 내리지 못한다.

대표 사례: 비스페놀A(BPA) 검출 보도가 있는 제품에 대해, 제조사는 해외 기관 시험을
근거로 안전을 주장하지만 국내 KC 인증 시점이 달라(예: 2023 vs 2025 보도) 소비자는
간극을 메우지 못한다. → 본 앱은 이 간극과 "무엇을 확인해야 하는지"를 구조화한다.

## Users / Personas

- Primary: **초보 부모**(신생아~유아 양육), 의학·인증 용어에 익숙하지 않음.
- Excluded(now): 전문 의료진용 데이터베이스, 커뮤니티/리뷰 SNS, 커머스 결제.

## Data Objects (seed, MECE)

- Category(카테고리): 수유·위생/목욕·수면·이동/외출·놀이/발달·환경 (+ 하위 item).
- SafetyAxis(안전축): 화학(BPA·프탈레이트·중금속·VOC)·물리(질식·끼임·KC기준)·인증(KC·식약처·FDA·EN)·위생·연령적합성.
- TrustedSource(공신력 출처): 식약처·한국소비자원·KC(국표원)·대한소아청소년과학회·하정훈 삐뽀삐뽀119·맘톡TV·FDA·EU EN71.
- CaseNote(사례 메모): BPA·가습기 살균제·프탈레이트 등 정직하게 프레이밍한 주의/간극 메모.
- Brief(결과): verdict·연령적합성·안전축 근거·정보간극·체크리스트·출처·대안.

## Actions / Screens / APIs

- Screen 1 (입력/탐색): 제품·우려 입력 + MECE 카테고리 칩으로 빠른 채움.
- Screen 2 (브리프): 안전 판정 + 근거 + 정보간극 + 체크리스트 + 출처.
- `GET  /api/health` → { ok, app, model, authMode }
- `GET  /api/categories` → MECE 카테고리/축/출처 트리 (탐색 + 구조 증거)
- `POST /api/brief` → Copilot SDK가 구조화한 **안전 브리프** (실패 시 fallback)

## Copilot SDK 사용 (mandatory, traceable)

`POST /api/brief`가 핵심 워크플로. 입력(제품/우려)+seed 컨텍스트(카테고리/축/출처/사례)를
프롬프트로 묶어 SDK 세션에 보내고, 구조화 JSON(BRIEF_SCHEMA)을 받아 화면에 렌더한다.
가짜 UI 카피가 아니라 실제 결정 산출물 생성 경로.

## Success Criteria

- 입력 → 구조화 브리프(판정·근거·정보간극·체크리스트·출처)가 1회로 나온다.
- 로컬 단위 smoke PASS, `/api/health` ok, `/api/brief` 200(JSON 스키마 충족).
- Azure public URL에서 fallback로도 동일 화면이 동작.
- 100% 한국어 UI + Warm Editorial.

## Risks (accepted)

- R1(Amber): Azure에서 Copilot SDK 런타임/인증 미동작 → fallback "오프라인 근거 엔진"
  (`source: fallback`, HTTP 200) + source 배지 + README 환경 분리.
- R2: LLM JSON 파싱 불안정 → robust 파서 + normalizeBrief + 단위 smoke.
- R3(중요): **의학적/안전성 오정보 위험** → 시험결과 날조 금지. 판정은 결정지원이며
  보증이 아님을 명시. 정보간극과 "공신력 출처 확인"을 강조하는 정직 설계.

## Decisions

- D1: 컨셉 = "안심육아 브리프"(가제). 판매/인기 대신 공신력·의학·환경호르몬 근거.
- D2: 스택 = Node + Express 단일 서비스 + vanilla 프론트(검증된 패턴 재사용).
- D3: 커머스/로그인/DB/커뮤니티 = DEFER. 영속성은 localStorage(MVP).
- D4: 데이터는 소규모 큐레이션 seed(정직) + SDK 추론. 외부 크롤링/실시간 인증조회 = DEFER.

## Open Questions

- Q1: 최종 제품명 확정(가제 "안심육아 브리프").
- Q2: Azure SDK 실동작 여부 → 배포 smoke로 확정.
- Q3: 카테고리 seed 범위 확장(현재 6카테고리) — 시간에 따라.

## Error Book

- (예정) Azure SDK 인증 결과 / 파싱 실패 케이스 기록.
