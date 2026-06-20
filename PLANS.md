# PLANS.md — 안심육아 브리프 (Lipcoding 2026)

## Problem Definition
초보 부모가 육아템 안전성을 판단할 때 흩어진 조사·정보간극으로 결정하지 못한다.
판매량/인기 대신 **공신력·의학·환경호르몬 근거**로 빠른 결정을 돕는다.

## Evidence Brief
- 근거 데이터: `research/briefs/safety-sources.md` (MECE 카테고리·안전축·공신력 출처·사례).
- 상위 제약: 개인 생산성 웹앱 + Copilot SDK + Azure (`.github/copilot-instructions.md`).
- 검증된 패턴 재사용: 형제 워크트리의 "하루 정리"(Node+Express+SDK+fallback+Warm Editorial).

## Method Selection
- 소규모 큐레이션 seed + SDK 추론(브리프 생성). 실시간 인증 크롤링은 DEFER.
- 정직성 우선: 시험결과 날조 금지, 정보간극·출처확인 강조(replication 불가 영역은 INSUFFICIENT).

## Execution Plan (vertical slice)
1. `lib.js` — seed(카테고리/축/출처/사례) + buildBriefPrompt + parseJson + normalizeBrief + fallbackBrief.
2. `server.js` — `/api/health`, `/api/categories`, `/api/brief`(SDK→fallback).
3. `public/` — Warm Editorial 한국어 UI(입력+카테고리칩 → 브리프 렌더 + 면책).
4. `scripts/smoke.js` — 네트워크 비의존 단위 smoke.
5. 로컬 smoke(unit/api/browser) → Azure 배포 + public URL smoke.

## Records
- baseline: 빈 워크트리(off main).
- search space: 6 카테고리 × 5 안전축.
- promotion rule: smoke PASS 시 슬라이스 확정.
- kill rule: SDK 30분 내 미동작 → fallback 확정 / seed 확장이 smoke 깨면 동결.
- stop rule: 16:30 KST 이후 기능 동결.
- final eval: `/api/health` ok + `/api/brief` 스키마 충족 + browser 렌더 + Azure URL smoke.

## Status
- [x] 워크트리 분리(`안심육아-립코딩-2026`)
- [x] 기획(LLM-Wiki·trace graph·sources brief)
- [x] 앱 구현 (lib/server/public/smoke)
- [x] 로컬 smoke (unit 46 · api · browser real-SDK)
- [x] Azure 배포 + public URL smoke (http://ansim-yuka-20260620131931.azurewebsites.net)
- [x] 데이터 흐름도·맹점 브리핑 + 시드확장/출처링크(B4·B7)
- [x] **프론트엔드/UX 재구성** (악마의 토론 6R) — 가이드 서가/모달 + 육아 친화 Warm Editorial · Azure 재배포

## Phase 2 — 프론트엔드/UX 재구성 (계획)

목표: 초보 부모용 **육아 친화 Warm Editorial** 리스타일 + **안심 가이드 서가(리스트)** + **상세 모달**.
근거: `research/decisions/debate-frontend-ux.md`(6R), `research/decisions/design-direction-ux.md`.

방법/결정:
- 스택: **검증된 vanilla 단일 서비스 유지**. React/Vite/shadcn = **DEFER**(배포 리스크 > 가치).
- 메타포: editorial-desk + 라이브러리/서가. 모달 = 상세 리딩.
- 신규 표면: `GET /api/guide`(시드 읽기전용 노출) + 프론트(그리드/필터/모달/리스타일).
- 카탈로그는 "큐레이션 체크포인트(비보증)" 카피로 오해 방지. SDK 진입 above-the-fold 유지.

실행 단계(todo: impl-shell → impl-catalog → verify-redesign):
1. 셸 리스타일: 헤더/팔레트/타이포/마스코트, 판정색 의미 고정, 반응형(375/768/1280/1920).
2. 가이드 서가: 카드 그리드 + 카테고리 필터 칩, `GET /api/guide`.
3. 상세 모달: `<dialog>` 포커스트랩·ESC·aria, 체크리스트/정보간극/출처링크, "내 상황으로 물어보기" CTA→/api/brief.
4. 검증: unit(guide) + api(/api/guide 200) + browser(카드→모달→ESC→CTA→브리프, 반응형) + 스크린샷 → Azure 재배포.

Records:
- baseline: 현재 vanilla(입력→브리프), smoke 46 PASS, Azure live.
- kill rule: 모달 a11y/반응형 smoke 실패 시 배포 금지 / React 욕심 즉시 컷 / 16:30 KST 이후 기능 동결.
- stop rule: 카탈로그+모달+CTA+리스타일 smoke PASS 시 슬라이스 확정.
- final eval: /api/guide 200 + 모달 열기/닫기/ESC/포커스 + 반응형 무겹침 + /api/brief 유지 + Azure URL smoke.

## Decision Log (append)
- D1 컨셉/스택 확정(00-event-brief D1~D4).
- D2 로컬 `source: copilot-sdk` 실동작 확인(10-sdk-evidence) — 비결정적 비순응 응답은 fallback로 안전 전환.
- D3 Azure 배포 완료, `source: fallback`로 가용성 유지(20-deploy-evidence). 정직한 환경 분리.
- D4 시드 3→10·출처 URL 링크(B4·B7) 적용·재배포.
- D5 **프론트 재구성: vanilla 유지 + 가이드 서가/모달 추가 + 육아 친화 Warm Editorial. React=DEFER**(악마의 토론 6R 합의 KEEP).
- OPEN: 최종 제품명 확정 · 가이드/브리프 탭 내비(DEFER) · 제품 비교(DEFER, 제품DB 필요).
