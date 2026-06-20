# 00 Event Brief — 하루 정리 (Lipcoding 2026)

> 상위 과제: 개인 생산성 향상 웹앱 / Copilot SDK 필수 / Azure 배포 필수.
> 세부 공식 주제 원문은 미수신. 본 브리프는 "개인 생산성"의 작동 정의와 첫 vertical slice를 고정한다.

## 생산성 정의 (locked)

생산성 증진 = **흩어진 입력을 정리해 "다음에 무엇을 할지" 결정 비용을 줄이고, 실행과 마무리까지 잇는 것.**
"더 많이 하기"가 아니라 "결정과 마무리의 비용을 낮추기".

3가지 레버:
- Clarity(명료성): 무엇을 먼저 할지 결정.
- Focus(집중): 전환/과부하 줄이기.
- Closure(마무리): 끝내고 회고로 잇기.

MVP는 **Clarity + Closure**에 집중한다. Focus(타이머/집중모드)는 DEFER.

## Problem

할 일과 메모가 머릿속·여러 메모에 흩어져 있어, "다음에 뭘 할지" 결정에 에너지를 소모한다.

## Users

- Primary: 할 일이 흩어진 직장인/학생.
- Excluded(now): 팀 협업, 멀티 디바이스 동기화 사용자.

## Features (kept)

- 자유 텍스트 입력 → Copilot SDK가 Top3 우선순위 / 분류 / 내일 계획을 구조화.

## Risks

- R1(Amber): Azure에서 Copilot SDK 런타임/인증 미동작 가능 → fallback "오프라인 정리 모드" + source 배지 + README 환경별 evidence 분리.
- R2: LLM JSON 파싱 불안정 → robust 파서 + 단위 smoke로 차단.

## Decisions

- D1: 컨셉 = "하루 정리". (PM/Tech Lead/User Advocate ≥ conditional, Devil 조건 충족)
- D2: 스택 = Node + Express 단일 서비스. (배포 단순화)
- D3: Focus 레버(타이머 등) = DEFER.
- D4: 로그인/DB/공유/동기화 = DEFER.

## Open Questions

- Q1: 공식 주제 원문이 세부 제약(예: 특정 도메인)을 추가하면 slice 재조정.
- Q2: Azure에서 SDK 실동작 가능 여부는 배포 smoke로 확정.

## Error Book

- (예정) Azure SDK 인증 결과를 배포 후 기록.
