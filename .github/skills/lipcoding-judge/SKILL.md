---
name: lipcoding-judge
description: Pre-review a Lipcoding 2026 final deliverable against the contest rubric before submission. Use when the user wants to "judge", "심사", "검수", or evaluate the app's P0 gates (personal productivity web app, Copilot SDK, Azure public URL, Korean UI, local smoke, secret safety) and produce a weighted READY/CONDITIONAL/BLOCK verdict with evidence.
---

# Lipcoding Judge

`judge/` 폴더의 심사위원 도구를 사용해 대회 최종물을 제출 전에 사전 검수한다.
이 스킬은 결정적 자동 증거 수집(머신)과 정성 판단(LLM)을 분리하되 같은 루브릭으로 종합한다.

## When to use

- 사용자가 "심사/검수/judge/평가"를 요청할 때.
- vertical slice 완료 후, 그리고 제출 직전.
- README/문서가 실제 코드와 일치하는지(드리프트) 확인이 필요할 때.

## How to run (machine)

```bash
node judge/checks/run-all.mjs --local                         # 현재 repo (오프라인 결정적)
node judge/checks/run-all.mjs --target <projectDir> --local   # 다른 프로젝트 평가
node judge/checks/run-all.mjs --local --azure-url <PUBLIC_URL> # 로컬 + Azure 전체
node judge/checks/run-all.mjs --local --audit                 # 의존성 취약점(npm audit) 포함
npm run judge                                                 # 단축(현재 repo)
```

- 출력: `judge/reports/judge-report-<slug>-<timestamp>.{md,json}` + `latest-<slug>.{md,json}`.
- P0 게이트 FAIL 이 하나라도 있으면 exit code 1.
- 보안 advisory(등급 A+~D)는 제품 점수와 분리되며, 하드코딩/추적 시크릿은 G6 게이트로 BLOCK.

## Rubric (single source of truth)

- 기계용: `judge/rubric/weights.json`
- 사람용: `judge/rubric/00-p0-gates.md`, `10-scoring-rubric.md`, `20-evidence-map.md`
- P0 게이트: G1 생산성 웹앱 · G2 Copilot SDK 실사용 · G3 Azure public URL · G4 한국어 UI · G5 로컬 동작 · G6 시크릿 안전
- 점수 차원(합100): productivity15 · sdk-depth20 · verification15 · honesty15 · design15 · engineering10 · docs10
- 판정: 게이트 FAIL→BLOCK / 전 게이트 PASS & 총점≥80→READY / 그 외→CONDITIONAL

## How to judge (LLM)

`judge/agent/lipcoding-judge.md` 프로토콜을 따른다:
1. `weights.json` 과 rubric 로드.
2. `npm run judge`(또는 run-all)로 최신 증거 생성.
3. 최신 `judge/reports/*.json` 을 근거로 게이트/점수 확인.
4. 생산성 가치·디자인·정직성 등 정성 차원 보강.
5. `judge/templates/judge-report-template.md` 형식으로 한국어 평결 작성.

## Rules

- 관측되지 않은 것을 PASS 로 쓰지 않는다.
- 문서<->코드 드리프트(예: README 의 `/api/copilot` 는 실제 라우트 아님)를 반드시 잡는다.
- 라이브 SDK source(copilot-sdk/fallback)는 환경 의존이므로 게이트 FAIL 이 아니라 증거로 기록.
- 모든 FAIL/WARN 에 "다음 최소 수정"을 제시한다.
- 시크릿 원문을 리포트에 절대 출력하지 않는다.
