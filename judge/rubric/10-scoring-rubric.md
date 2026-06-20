# 점수 루브릭

기계 단일 진실원천은 `judge/rubric/weights.json`이다. 문서 판정은 아래 값과 일치해야 한다.

## 계산식

| 항목 | 규칙 |
| --- | --- |
| 상태값 | PASS=1, WARN=0.5, FAIL=0, SKIP=null |
| 차원 점수 | `Σ(weight·statusValue)/Σ(weight)`; SKIP은 분모 제외 |
| 총점 | `Σ(차원점수·차원weight)/Σ(평가된 차원weight)·100` |
| 게이트 | 게이트 체크 하나라도 FAIL이면 해당 게이트 FAIL; WARN은 통과 경고; SKIP 게이트는 CONDITIONAL |
| 최종 판정 | 게이트 FAIL 존재→BLOCK; 전 게이트 PASS & 총점>=80→READY; 그 외→CONDITIONAL |

## 임계값

| 이름 | 값 | 의미 |
| --- | ---: | --- |
| ready | 80 | 모든 게이트 PASS일 때 READY 최소 총점 |
| conditional | 60 | CONDITIONAL 판단 기준값 |

## 차원별 기준

| 차원 | 가중치 | 정의 | PASS | WARN | FAIL | 만점 예시 | 감점 예시 |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| productivity | 15 | 결정 비용을 줄이는 실제 생산성 워크플로우 | 입력→우선순위→다음 행동이 명확 | 가치 설명은 있으나 행동 연결 약함 | 생산성 앱으로 보기 어려움 | 오늘 할 일 Top3와 내일 계획 생성 | 결과가 장식 문구뿐 |
| sdk-depth | 20 | Copilot SDK end-to-end 통합 깊이 | dependency→import→session→prompt→message→parse→endpoint 확인 | SDK 경로는 있으나 일부 fallback 의존 | import만 존재하거나 가짜 사용 | `/api/plan`, `/api/assist`가 SDK 세션을 실제 호출 | 존재하지 않는 `/api/copilot`만 문서화 |
| verification | 15 | 로컬/API/브라우저/Azure smoke 증거 | 자동 리포트와 명령·URL 증거가 있음 | 일부 smoke SKIP 또는 수동 증거만 있음 | 실행 증거 없음 | local+Azure 리포트 JSON/MD 생성 | 실패를 숨기거나 미실행 |
| honesty | 15 | 정직성·문서일치·한계 표기 | source 배지, fallback 한계, 문서-코드 일치 | 작은 드리프트가 명시됨 | 거짓 endpoint/SDK 주장 | Azure fallback을 게이트 FAIL로 과장하지 않고 증거로 분리 | README가 `/api/copilot`을 실제처럼 주장 |
| design | 15 | Warm Editorial 한국어 UI 품질 | 베이지/잉크/단일 레드, 상태 표현, 반응형 | 한국어는 맞지만 밀도/상태 약함 | 영어 잔재, 깨짐, 장식 위주 | 첫 화면에서 작업 상태와 CTA가 보임 | 텍스트 겹침, 영어 placeholder |
| engineering | 10 | 견고성·에러 처리·fallback | 입력 검증, timeout, fallback, 스키마 정규화 | happy path 중심이나 복구 가능 | crash/무응답/시크릿 노출 | SDK 실패 시 동일 스키마 fallback | 예외가 사용자에게 원문 stack으로 노출 |
| docs | 10 | 문서·의사결정 기록 | 실행 명령, API, 증거, 한계가 코드와 일치 | 일부 오래된 문서가 있으나 표시됨 | 실행 불가 문서, 핵심 누락 | README와 judge 문서가 실제 `/api/plan`, `/api/assist`를 사용 | `/api/copilot` 드리프트 미표기 |
