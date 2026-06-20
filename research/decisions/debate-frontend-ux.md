# 악마의 토론 (Devil's Debate) — 프론트엔드/UX 재구성 (6라운드)

## Debate State
- Decision being made: 초보 부모용 안심육아 브리프의 **프론트엔드/UX를 리코딩 스킬 기반으로 재구성**.
  (1) Warm Editorial을 "육아 친화"형으로 적용, (2) 카테고리화된 안전정보를 **부모가 리스트로 탐색 + 모달 상세**,
  (3) 스택/배포 리스크 통제.
- Time budget: Full (사용자가 6라운드 명시). 복잡도: Medium-High.
- Round used: 6 (홀수=CEO 참여, 짝수=CEO 제외, Devil 항상 마지막).
- 상위 제약: 개인 생산성 웹앱 · Copilot SDK 필수 · Azure 배포 필수.

---

## Round 1 — 컨셉·스코프 (CEO 참여)

**PM** — 사용자는 신생아~유아를 키우는 초보 부모. JTBD: "지금 이 육아템이 안전한지 빨리 판단".
현재 앱은 입력→브리프뿐이라, **시작점이 텅 빈 입력창**이라 막막하다. MVP 경계: 입력 기반 브리프(유지) +
**큐레이션된 안전 가이드 카탈로그(리스트)** + **상세 모달**. 채점 적합성: 빈손인 부모도 즉시 탐색 가능 → 첫인상↑.

**Tech Lead** — 데이터는 이미 `lib.js`에 있다(CASE_NOTES 10, CATEGORIES 6, SOURCES 8). 새 화면은
**기존 시드를 읽기 전용으로 노출**하는 `GET /api/guide` 하나면 충분. 카드 리스트+모달은 추가 의존성 0.
Copilot SDK 경로(/api/brief)는 그대로 유지 → 리스크 없음.

**User Advocate** — 부모는 "내 제품"이 목록에 없으면 실망한다. 카탈로그는 **제품 목록이 아니라 "안전 주제/체크포인트"**
임을 명확히 카피로 안내해야 한다. 예: "젖병·쪽쪽이 — 환경호르몬 체크". 모달엔 "구매 전 확인 체크리스트"를
체크 가능한 형태로. 피곤한 부모용 → 큰 탭 타깃, 적은 글, 친절한 톤.

**CEO** — 데모 각: "텅 빈 AI 입력창"이 아니라 **'안심 가이드 서가'가 먼저 보이고, 카드를 누르면 전문가가 정리한
체크리스트가 모달로 뜬다**. 심사위원이 한눈에 "부모를 위한 제품"임을 느낀다. 업사이드: 카탈로그가 SEO/공유에도 유리(차후).

**Devil's Advocate (마지막)** — 위험: ① 카탈로그가 "제품 추천"처럼 오해되면 신뢰도 붕괴(우리는 제품 DB 없음).
② 모달이 모바일에서 깨지면 피곤한 부모가 이탈. ③ 카탈로그에 매몰돼 Copilot SDK 핵심 워크플로가 가려지면
채점에서 "SDK 부수적"으로 보일 위험. → 카피로 "주제 가이드"임을 명시(FIX), 모달 반응형 smoke 필수(FIX),
입력 브리프를 카탈로그와 **동등 비중**으로 배치(FIX).

---

## Round 2 — 스택/배포 (closure, CEO 제외)

**PM** — "재구성"이 곧 "React 재작성"은 아니다. 사용자 가치는 **보이는 디자인·탐색성**이지 프레임워크가 아니다.

**Tech Lead** — 현재 vanilla 단일 서비스가 Azure에 **빌드 스텝 없이** 떠 있고 smoke 통과. React/Vite/shadcn로
가면 (a) 빌드 산출물 정적 서빙 설정, (b) Oryx SPA 빌드, (c) 재배포 리스크가 새로 생긴다. warm-editorial-ui
스킬의 **Design Contract(팔레트·한국어·반응형·상태)는 프레임워크 무관**하게 vanilla CSS로 충족 가능.
스킬의 React 스택은 "preferred"이고, copilot-instructions는 "React **또는** 단순 서버렌더 UI"를 명시 허용.

**User Advocate** — 부모 UX 품질은 마이크로카피·여백·탭 타깃·모션에서 나온다. 이건 vanilla로도 100% 가능.

**Devil's Advocate (마지막)** — React 마이그레이션은 **남은 시간 대비 배포 리스크가 가장 큰 함정**(B5 콜드스타트
위에 빌드 리스크 추가). 단, vanilla로 가면 styles.css가 비대해질 수 있음 → CSS 토큰/BEM 정리로 통제(FIX).
**결정: 검증된 vanilla 단일 서비스 유지 + 디자인 시스템 강화. React/Vite/shadcn = DEFER**(이유: 배포 안정성 우선).

---

## Round 3 — 브라우즈 리스트/모달 인터랙션 (CEO 참여)

**PM** — 카탈로그 = 두 묶음: **카테고리 6**(수유·위생/목욕·수면·이동/외출·놀이/발달·환경) + **안전 주제 10**
(BPA·가습기·카시트·유모차·물티슈·로션·수면/SIDS·파우더·기저귀·프탈레이트). 필터 칩(카테고리)으로 좁히기.

**Tech Lead** — `GET /api/guide` → `{ categories, topics }`. topic 카드 클릭 → 모달에 topic 상세
(summary·연령적합성·체크리스트·정보간극·대안·출처링크). 모달은 `<dialog>` 표준 요소(접근성·ESC·백드롭 무료) 또는
경량 커스텀. **데이터는 fallbackBrief 로직 재사용**(topic→브리프 형태). "이 주제로 AI 브리프 받기" 버튼으로
모달→/api/brief 연결(카탈로그가 SDK 워크플로로 이어짐 → Devil R1 우려 해소).

**User Advocate** — 모달 카피: 제목 "전문가 체크포인트", 하단 CTA "내 상황으로 물어보기". 카드엔 아이콘+한 줄 요약+
판정 색칩(주의/경고/정보). 빈손 부모도 "아, 이런 걸 봐야 하는구나"를 즉시 학습.

**CEO** — "카드 → 모달 → '내 상황으로 물어보기' → AI 브리프"의 **3스텝 데모 플로우**가 깔끔하다. 기억에 남는 각.

**Devil's Advocate (마지막)** — `<dialog>` 브라우저 호환은 OK지만 **포커스 트랩·스크롤 락·모바일 풀스크린**을
직접 검증해야 함(FIX: browser smoke에 모달 열기/닫기/ESC/포커스 포함). 모달 안에 카드 중첩 금지(스킬 규칙).
topic 10개가 더 늘면 리스트 스캔 피로 → 카테고리 필터 필수(FIX).

---

## Round 4 — 미감 재조정: 아기자기 ↔ Warm Editorial (closure, CEO 제외)

**PM** — 사용자는 "아기자기"를 원함. 스킬은 "Warm Editorial(quiet/premium)". 충돌처럼 보이지만 **양립 가능**.

**Tech Lead** — 토큰 차원에서 조정: 기존 베이지/잉크/싱글 레드 유지 + **부드러운 라운드(10~14px), 따뜻한 코랄
보조 톤, 둥근 친근 아이콘, 작은 마스코트 마크, 포근한 그림자, 넉넉한 여백**. 무지개 원색·코믹산스·블롭 금지(스킬).

**User Advocate** — "아기자기"의 핵심은 **친근한 마이크로카피 + 부드러운 형태 + 안심을 주는 색온도**다.
타깃: 피곤한 부모가 "따뜻하고 신뢰가 간다"고 느끼되 유치하지 않게. 판정 색은 의미 고정(안심=초록, 주의=황,
경고=레드, 정보부족=블루그레이). **레드는 '경고/주요액션' 한 가지 의미로만**(스킬 규칙).

**Devil's Advocate (마지막)** — "아기자기"를 과하게 하면 **agency-grade 신뢰도가 깨지고 의료/안전 앱의 권위가
약화**(B3 오정보 인상 악화). → 절제된 "따뜻한 에디토리얼": 색온도·라운드·마스코트는 **악센트로만**, 본문은
여전히 정돈된 에디토리얼. 마스코트는 1곳(브랜드 마크)만. 장식 과잉 = CUT.

---

## Round 5 — 정보구조·내비·SDK 표면 (CEO 참여)

**PM** — 한 화면 2영역 구조 유지하되 순서 재배치: **상단 = 안심 가이드 서가(카탈로그)**, 그 아래 또는 우측 =
**"내 상황으로 물어보기"(AI 브리프 입력+결과)**. 탭 전환(가이드/내 브리프)도 가능하나, MVP는 스크롤 단일 페이지.

**Tech Lead** — 내비 모델: 데스크톱 = 2열(가이드 그리드 좌, 브리프 우) 또는 상하 섹션. 모바일 = 세로 스택
(가이드 먼저 → 브리프). Copilot SDK 표면은 **브리프 패널 + 모달 CTA** 두 진입점 → SDK가 워크플로 중심에 유지.

**User Advocate** — 첫 뷰포트(above the fold)에 **가이드 카드 몇 개 + "내 상황으로 물어보기" 진입**이 같이 보여야.
랜딩 히어로 금지(스킬). 헤더는 얇게, 바로 앱 표면.

**CEO** — "서가에서 고르거나, 직접 물어보거나" 두 갈래가 한 화면에 = 부모 친화 + AI 강조 동시 충족.

**Devil's Advocate (마지막)** — 2영역이 데스크톱에서 균형 안 맞으면 한쪽이 죽는다. 그리드 비율 검증 필요(FIX).
above-the-fold에 SDK 진입이 없으면 채점 약화 → 우측/상단에 브리프 입력 항상 노출(FIX). 탭 도입은 복잡도↑ → DEFER.

---

## Round 6 — 최종 리스크 게이트·컷 리스트 (closure, CEO 제외)

**PM** — KEEP: ① 가이드 카탈로그(카드 리스트+필터) ② 상세 모달 ③ 모달→AI 브리프 CTA ④ 육아 친화 Warm
Editorial 리스타일 ⑤ 기존 /api/brief 유지. 한 슬라이스로 로컬 구동 가능.

**Tech Lead** — 신규 코드 표면: `GET /api/guide`(읽기 전용, 시드 노출) + 프론트(그리드/모달/리스타일). 백엔드 로직
위험 낮음. smoke: unit(guide 데이터) + api(/api/guide 200) + browser(카드 클릭→모달→ESC→CTA).

**User Advocate** — 카피 톤 통일(친근+정확), 판정 색 의미 고정, 접근성(모달 포커스/aria) 필수. 빈/로딩/에러/성공
상태 모두 카피 확정.

**Devil's Advocate (마지막, 최종 게이트)** —
- 남은 핵심 리스크 B1(실데이터 미연동)·B3(환각)은 이번 슬라이스 범위 밖 → **카탈로그는 "큐레이션 체크포인트"이지
  "안전 보증"이 아님**을 모달·푸터에 명시(ACCEPT_RISK + 면책 유지).
- React 욕심 = DEFER 확정(배포 안정성).
- 모달 반응형/접근성 미검증 = 배포 금지(FIX, smoke 강제).
- 16:30 KST 이후 신규기능 금지 규칙 준수.
- **최종: KEEP 승인. 단 (a) 모달 a11y/반응형 smoke, (b) "주제 가이드/비보증" 카피, (c) above-the-fold에 SDK 진입,
  (d) 장식 절제 — 4개 조건 충족 시 구현.**

---

## Vote / Closure

| Role | Vote | Condition or objection |
| --- | --- | --- |
| PM | agree | 카탈로그+브리프 동등 비중 |
| Tech Lead | agree | vanilla 유지, /api/guide 1개만 추가 |
| User Advocate | conditional | 친근 카피·판정색 고정·a11y |
| CEO | agree | 3스텝 데모 플로우 |
| Devil's Advocate | conditional → resolved | 모달 a11y/반응형 smoke·비보증 카피·SDK 노출·장식절제 (모두 FIX/ACCEPT) |

Consensus: PM·Tech Lead·User Advocate ≥ conditional, Devil 조건 FIX/ACCEPT → **KEEP**.

---

## Keep / Cut / Defer / Must Test

| Item | Decision | Reason |
| --- | --- | --- |
| 안심 가이드 카탈로그(카드+카테고리 필터) | KEEP | 빈손 부모 탐색성, 기존 시드 활용 |
| 안전 주제 상세 모달 | KEEP | "리스트→모달 예시" 사용자 요청 직접 충족 |
| 모달→"내 상황으로 물어보기" CTA | KEEP | 카탈로그를 Copilot SDK 워크플로로 연결 |
| 육아 친화 Warm Editorial 리스타일 | KEEP | "아기자기" 요청 ∩ 스킬 디자인 컨트랙트 |
| `GET /api/guide` 읽기전용 | KEEP | 시드 노출, 의존성 0 |
| React/Vite/Tailwind/shadcn 마이그레이션 | DEFER | 배포 리스크 > 가치(검증된 vanilla 유지) |
| 가이드/브리프 탭 내비 | DEFER | MVP는 단일 스크롤로 단순화 |
| 제품 단위 비교/추천 | DEFER | 제품 DB 없음(B6) |
| 모달 열기/닫기/ESC/포커스/반응형 | MUST TEST | Devil 게이트 |
| 카탈로그 "비보증·주제 가이드" 카피 | MUST TEST | 신뢰·오해 방지 |

---

## Smallest Vertical Slice
- User: 초보 부모(빈손 진입 포함)
- Action: 가이드 서가에서 안전 주제 카드 클릭 → 모달로 체크포인트 확인 → "내 상황으로 물어보기"로 AI 브리프
- Screen: 단일 페이지 — 상단 헤더(얇게) / 가이드 그리드(+카테고리 필터) / "내 상황으로 물어보기" 브리프 패널
- Data/API: `GET /api/guide`(시드 노출), 기존 `GET /api/categories`, `POST /api/brief`(SDK→fallback)
- Copilot SDK use: 브리프 패널 + 모달 CTA 두 진입점 → /api/brief 세션
- Smoke: unit(guide tree) · api(/api/guide 200) · browser(카드→모달→ESC→CTA→브리프 렌더, 375/768/1280)
- Azure deploy path: 변경 없음(vanilla 단일 서비스, az webapp up 재배포)

## Handoff Prompt
Use lipcoding-design-director to lock metaphor/screens, then lipcoding-warm-editorial-ui to implement:
"육아 친화 Warm Editorial로 안심 가이드 서가(카드 리스트+카테고리 필터)와 안전 주제 상세 모달을 구현.
모달 하단 CTA는 기존 /api/brief로 연결. vanilla HTML/CSS/JS 유지, 375/768/1280/1920 반응형,
모달 포커스/ESC/aria, 판정색 의미 고정, 레드 액센트 단일 의미, 장식 절제, 100% 한국어."
