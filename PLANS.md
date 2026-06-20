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
- [x] 로컬 smoke (unit 31 · api · browser real-SDK)
- [x] Azure 배포 + public URL smoke (http://ansim-yuka-20260620131931.azurewebsites.net)

## Decision Log (append)
- D1 컨셉/스택 확정(00-event-brief D1~D4).
- D2 로컬 `source: copilot-sdk` 실동작 확인(10-sdk-evidence) — 비결정적 비순응 응답은 fallback로 안전 전환.
- D3 Azure 배포 완료, `source: fallback`로 가용성 유지(20-deploy-evidence). 정직한 환경 분리.
- OPEN: 최종 제품명 확정(가제 "안심육아 브리프") · 카테고리 seed 확장.
