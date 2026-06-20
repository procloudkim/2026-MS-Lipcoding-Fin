# 악마의 토론 (Devil's Debate) — "그래서 뭘 사라는 건데?" (10라운드)

## Debate State
- Decision being made: 핵심 가치 재정의. 현재 앱은 **이미 고른 제품을 "검증"**하지만, 부모의 진짜 페인은
  **"그래서 뭘 사야 하는데?"**(구매 *전* 결정). "산 뒤 검증"은 매몰비용이라 의미가 약하다.
  → 앱을 **구매 전 결정 지원(pre-purchase decision support)**으로 전환할지, 어떻게 책임/정직성을 지키며
  "무엇을 사라"에 답할지 결정.
- Time budget: Full(사용자가 10라운드 명시). 복잡도: High(책임·정직성·데이터 부재·스코프).
- Round used: 10 (홀수=CEO 참여 5역할, 짝수=CEO 제외 4역할, Devil 항상 마지막).
- 상위 제약: 개인 생산성 웹앱 · Copilot SDK 필수 · Azure 배포 필수 · 정직성(시험결과·안전 보증 날조 금지).
- 입력: `research/decisions/debate-frontend-ux.md`, `research/briefs/data-flow-and-risks.md`(B6 제품DB 없음),
  현재 `/api/brief`(검증형 출력), `lib.js` 시드.

---

## Round 1 — 문제 재정의: "검증" → "무엇을 살까" (CEO 참여)

**PM** — JTBD 재진술: 부모는 "이거 안전해?"보다 **"신생아 젖병, 뭘 어떤 기준으로 사야 안전해?"**를 더 절박하게
묻는다. 현재 출력(판정+확인 체크리스트)은 *제품을 이미 손에 쥔* 사용자에게 최적화됨 → 구매 *후* 시점.
페인의 무게중심은 **구매 결정 직전**(매장/장바구니 앞). MVP 가치축을 "검증"에서 "**무엇을·어떤 기준으로 살지**"로 이동.

**Tech Lead** — 좋은 소식: 데이터/엔진은 재사용 가능. `/api/brief`의 출력 스키마에 **"추천 사양·후보 유형·피해야 할
신호"** 차원을 추가하면 됨. 나쁜 소식: **특정 제품(브랜드) 추천은 제품 DB가 없고(B6) 책임 리스크가 크다**.
"무엇을 사라"를 **브랜드가 아니라 '살 수 있는 속성(사양)' 수준**으로 답하는 설계가 관건.

**User Advocate** — 부모 언어로: "필립스 vs 더블하트 뭐 사?"가 아니라 "**유리가 나아 PPSU가 나아? 신생아는 뭘 봐야
해?**"에 답해주면 80%는 해결. 즉 **유형/소재/인증 기준 + 내 상황 맞춤**이면 충분히 "샀다"는 느낌을 준다.

**CEO** — 데모 각이 강해진다: "검증기"는 흔하지만 "**초보 부모를 위한 안전 구매 결정기**"는 기억에 남는다.
"고르거나·물어보거나"에서 한 발 더 → "**어떤 기준으로 사면 되는지 딱 정해주는 앱**". 채점 차별화 큼.

**Devil's Advocate (마지막)** — 위험 경고:
1. **"추천=보증"의 함정.** 안전 도메인에서 "이걸 사세요"는 그 제품이 사고 나면 신뢰·법적 파국. 우리는
   "시험결과 날조 금지"를 천명했다. → 브랜드 추천은 **금지선**.
2. "유형/사양 추천"도 틀리면(예: "PPSU가 더 안전" 단정) 같은 문제. → **출처 연결 + 불확실 시 INSUFFICIENT** 강제.
3. 마감 임박 스코프 크리프. → 새 서비스 금지, 기존 /api/brief 확장만.
→ 방향 자체는 **수용**하되 "**브랜드가 아닌 기준·유형 추천 + 매장 확인 체크리스트**"로 좁혀야 KEEP 가능.

---

## Round 2 — 책임 게이트: 추천을 어디까지? (closure, CEO 제외)

**PM** — 추천 수준을 3단계로 분리: (A) **브랜드/제품명**, (B) **유형·소재**(유리/PPSU/PP/실리콘),
(C) **사양 기준**(KC 인증연도·BPA-free 성적서·광구형·느린유속). A는 금지, **B·C는 허용**(일반 지식·1차 기준).

**Tech Lead** — B·C는 제품 DB 없이도 가능하고, **각 주장에 공신력 출처를 매달 수 있음**(이미 sources 구조 보유).
C는 "매장에서 이 표기를 확인하라"로 자연스럽게 **구매 전 검증**으로 이어짐 → 페인 정확히 타격.

**User Advocate** — 부모는 B(유형)에서 "결정했다"는 안도를 얻고, C(사양)에서 "매장에서 뭘 보면 되는지"를 얻는다.
A(브랜드)는 오히려 광고처럼 보여 신뢰를 깎을 수 있음 → 없는 게 낫다.

**Devil's Advocate (마지막)** — B도 위험할 수 있다: "유리가 안전" 단정 → 깨짐/화상 트레이드오프 무시. →
**유형은 반드시 '장단점(tradeoff) 쌍'으로** 제시(안전축별 +/−). 절대 순위 단정 금지. C는 "보증"이 아니라
"확인 항목"으로 표현. **결정: A=금지(ACCEPT_RISK 차단), B=트레이드오프쌍 필수, C=확인항목 표현.**

---

## Round 3 — 해법 모델: "구매 사양 추천 + 매장 확인" (CEO 참여)

**PM** — 출력 모델 확정안 "**구매 결정 브리프(pre-purchase)**":
1. 추천 사양(buyable spec): 소재·인증·형태·연령단계 등 *매장에서 고를 수 있는 속성*.
2. 후보 유형 2~3개: 각 유형의 안전 장단점(tradeoff) 비교.
3. 피해야 할 신호(red flags): KC 미인증·출처불명·살균제첨가 등.
4. 매장/온라인 확인 체크리스트: 구매 *직전* 표기 확인.
5. 출처 + 면책 + (불확실) INSUFFICIENT.

**Tech Lead** — 구현은 `/api/brief` 스키마에 `recommendation { spec[], candidateTypes[ {type, pros[], cons[]} ],
avoid[] }` 추가. 프롬프트에 "브랜드 금지·유형은 장단점쌍·사양은 확인항목" 규칙 주입. fallback도 시드(CASE_NOTES)에
유형/사양 힌트를 넣어 동일 스키마 생성. **새 라우트 불필요**.

**User Advocate** — UI: 브리프 상단에 "**이렇게 사면 안심**" 카드(추천 사양 + 후보 유형 칩 + 피할 것),
그 아래 기존 체크리스트/근거. 가이드 모달에도 "이 주제로 살 때 기준" 미니 섹션.

**CEO** — "**무엇을 사야 하는지 기준을 정해주고, 매장에서 그대로 확인**"하는 플로우는 '검증기'를 '구매 코치'로
승격. 심사 데모: 가이드 카드 → "내 상황으로 물어보기" → **"이렇게 사면 안심" 사양표**가 뜬다.

**Devil's Advocate (마지막)** — 유형 비교가 "표"처럼 보이면 **객관적 시험데이터로 오해**될 수 있다(우리는 시험 안 함).
→ "일반적으로 알려진 트레이드오프 · 최종은 식약처/KC 확인" 라벨 필수. 후보 유형은 **3개 이하**, 각 pros/cons는
"안전축 용어"로만(과장 마케팅어 금지). FIX 반영 시 KEEP.

---

## Round 4 — 데이터 정직성: DB 없이 틀리지 않기 (closure, CEO 제외)

**PM** — 핵심 질문: "추천 사양"이 **틀리거나 과신**되면? (예: 특정 소재를 무근거로 권장). 정직성 원칙과 충돌 방지책 필요.

**Tech Lead** — 두 경로 모두 가드:
- SDK: 프롬프트에 "근거 없으면 추천하지 말고 '확인 필요'로", "각 사양에 왜(이유)+어디서 확인"을 강제. 스키마
  검증(normalize)에서 빈/과장 항목 제거.
- fallback: **시드에 명시된 유형/사양만** 사용(환각 0). 시드 밖이면 일반 원칙(KC·식약처·소재표기) + INSUFFICIENT.

**User Advocate** — 부모에게 "**무근거 단정**"은 "정보부족"보다 더 해롭다. "흔히 권장되는 기준"과 "확정 안전"을
카피로 구분("권장 기준" vs "보증 아님"). 추천 옆에 **항상 출처 칩**.

**Devil's Advocate (마지막)** — 가장 큰 함정: LLM이 그럴듯한 사양을 *지어냄*(B3 환각). → (1) 추천 항목 수 상한,
(2) 각 항목 **출처 필수, 없으면 드롭**, (3) "이 추천은 일반 기준이며 제품별 시험결과가 아님" 고정 면책.
**결정: 추천도 '근거 없으면 INSUFFICIENT' 원칙을 동일 적용**(검증과 동일한 정직 게이트).

---

## Round 5 — 개인화 입력: 무엇을 물어볼까 (CEO 참여)

**PM** — "내 상황 맞춤"이 핵심. 최소 입력: **연령단계(신생아/영아/유아)**, **사용 맥락**(예: 모유병행·열탕소독·외출용),
**우려**(환경호르몬/질식/피부), (선택) **예산대**. 많으면 피곤 → 3~4개, 전부 선택사항.

**Tech Lead** — 자유 텍스트 1칸(기존) + **선택 칩 몇 개**(연령/맥락/우려)로 컨텍스트 보강 → 프롬프트에 주입.
미입력이어도 동작(graceful). 예산은 "저가/표준/프리미엄대" 정도로만 — 가격 DB 없으니 **사양 우선순위 힌트**로만 사용.

**User Advocate** — 피곤한 부모용: 칩은 **탭 한 번**, 기본값 "상관없음". "신생아 + 모유병행 + 환경호르몬 걱정"
세 탭이면 충분히 맞춤 느낌. 입력 강요 금지.

**CEO** — "**3번 탭하면 우리 아기에 맞는 구매 기준이 나온다**" — 데모로 강렬. 개인화가 추천의 설득력을 높인다.

**Devil's Advocate (마지막)** — 개인화가 **과신을 키운다**("내 상황 딱 맞으니 이대로 사면 돼"). → 맞춤일수록
면책·출처를 더 강조. 예산 입력은 "싼 게 위험"이라는 **편향 조장 위험** → 예산은 *사양 우선순위*로만, 안전과 가격을
연결짓는 카피 금지. 칩은 4개 이하. FIX 시 수용.

---

## Round 6 — 출력 스키마·UI 매핑 (closure, CEO 제외)

**PM** — 최종 출력(구매 결정 브리프) 필드 합의:
`verdictForBuying`(살 만함/조건부/비권장/정보부족), `recommendedSpec[]`(항목+이유+확인처),
`candidateTypes[ {type, pros[], cons[], bestFor} ]`(≤3), `avoid[]`, `inStoreChecklist[]`, `sources[]`, `disclaimer`.
기존 `evidence/infoGaps/ageFit`는 보조로 유지.

**Tech Lead** — `normalizeBrief` 확장(신규 필드 정규화·상한·빈값 드롭·출처 URL 부착). fallback에 유형/사양 시드
매핑 추가. UI: 결과 상단 "**이렇게 사면 안심**" 블록(추천 사양 리스트 + 후보 유형 카드 + 피할 것), 하단 기존 섹션.
가이드 모달엔 "구매 기준" 미니 섹션 + CTA 문구를 "이 기준으로 사도 될까?"로.

**User Advocate** — 카피 톤: 명령형 아닌 제안형("이런 기준이면 안심돼요"). 후보 유형은 **장점/단점 2열**로 한눈에.
색: 추천=세이지(안심) 계열, 피할것=레드(경고) — 판정색 의미 유지.

**Devil's Advocate (마지막)** — UI에서 "후보 유형"이 **랭킹/별점처럼** 보이면 보증 오해. → 순위·점수 금지, "상황별
적합(bestFor)"으로만. "피할 것"이 특정 브랜드를 암시하면 안 됨(일반 신호만). 신규 필드 전부 **smoke 검증 대상**.

---

## Round 7 — Copilot SDK 중심성·스모크 (CEO 참여)

**PM** — 추천은 *개인화 추론*이라 규칙 기반보다 **LLM이 진짜 가치를 더하는 지점**. SDK가 부수적이지 않고 **핵심**이 됨
(채점 유리). fallback은 백업.

**Tech Lead** — SDK 경로: 컨텍스트(텍스트+칩) → `buildBriefPrompt`(구매 결정 규칙 주입) → 구조화 JSON → normalize.
스모크: unit(normalize 신규 필드·fallback 유형추천), api(/api/brief에 recommendation 포함), browser(추천 블록 렌더 +
가이드 모달 미니섹션), 로컬 real-SDK(추천 생성 확인).

**User Advocate** — SDK 응답이 늦을 때(콜드/지연) "추천 만드는 중…" 상태가 필요. 실패 시 fallback 추천이라도 보이게.

**CEO** — "**Copilot이 우리 아기에 맞는 구매 기준을 짜준다**" — SDK 활용 서사가 선명. 데모에서 source 배지로 증명.

**Devil's Advocate (마지막)** — SDK 추천이 **브랜드명을 뱉을 위험**(모델이 임의로). → 프롬프트 금지 + **normalize에서
브랜드 의심 토큰 필터/경고**까지 고려. 환각 사양은 출처 없으면 드롭. smoke에 "브랜드명 미포함" 체크 추가(FIX).

---

## Round 8 — 스코프·시간 컷 (closure, CEO 제외)

**PM** — 풀 추천기 vs 최소 슬라이스. 마감 고려 **최소**: 기존 /api/brief 출력에 `recommendation`(spec+types+avoid)
추가 + UI "이렇게 사면 안심" 블록 + 개인화 칩 3개. 그 이상은 DEFER.

**Tech Lead** — CUT/DEFER:
- DEFER: 실제 제품 DB·브랜드·가격/커머스(B1·B6), 비교표 정렬/필터, 예산 정밀화, 별도 추천 라우트.
- KEEP(최소): 스키마 `recommendation` 3필드 + normalize/fallback + UI 블록 + 칩 3개 + 가이드 모달 미니섹션.
- 위험 낮음(기존 패턴 재사용, 새 서비스 0).

**User Advocate** — 최소 슬라이스도 페인 핵심("뭘 사야")엔 직답. 칩 3개로 맞춤감 확보. 충분.

**Devil's Advocate (마지막)** — 시간상 **유형 비교(candidateTypes)**가 가장 무겁고 환각 위험 큼. 1차 슬라이스에선
**recommendedSpec + avoid + inStoreChecklist**(가장 안전·확실)부터, candidateTypes는 시드 보유 주제부터 점진.
"16:30 KST 이후 신규기능 금지" 준수. → **CUT 우선: candidateTypes는 시드 매칭 시에만 노출, 무근거면 생략.**

---

## Round 9 — 신뢰·UX·카피 (CEO 참여)

**PM** — 추천을 "보증"이 아닌 "**결정 가이드**"로 인지시키는 것이 신뢰의 핵심. 표현·배치가 절반.

**Tech Lead** — 면책을 추천 블록 *내부*에도 인라인("권장 기준이며 제품 보증 아님 · 매장에서 확인"). source 칩을
추천 항목에 직접 붙임.

**User Advocate** — 한국어 카피 확정:
- 블록 제목 "이렇게 사면 안심돼요" / 부제 "특정 제품 추천이 아니라, **안전한 선택 기준**이에요".
- 추천 사양: "○○ 소재 · KC 인증연도 확인 · BPA-free 성적서" 식 짧은 항목 + 이유 한 줄.
- 피할 것: "이런 건 피하세요" (KC 미인증/출처불명/살균제첨가).
- 빈 경우: "지금 정보로는 기준을 단정하기 어려워요. 아래 출처에서 확인해요."

**CEO** — 카피가 따뜻하면서 단호하면 "믿을 만한 육아 선배" 느낌. 그게 이 앱의 브랜드.

**Devil's Advocate (마지막)** — "안심돼요"가 **과한 안심**을 줄 수 있다 → "**더 안전한 선택에 가까워져요**" 같은
정도 표현 권장. 추천이 0개일 때 빈 블록 숨김(거짓 안심 방지). CEO의 "선배" 톤이 의료 단정으로 흐르지 않게 경계.
FIX(표현 완화) 시 수용.

---

## Round 10 — 최종 리스크 게이트·합의·슬라이스 (closure, CEO 제외)

**PM** — KEEP 확정: 앱 가치를 "**구매 전 안전 결정 지원**"으로 재정의. 출력에 `recommendation`(추천 사양·피할 것·
(조건부)후보 유형) + 매장 확인 체크리스트 + 개인화 칩 3개. "검증" 기능은 유지(보조).

**Tech Lead** — 신규 표면: `lib.js`(스키마/프롬프트/normalize/fallback 확장) + `public`(추천 블록·칩) + smoke 확장.
백엔드 위험 낮음. Azure 영향 없음(동일 서비스 재배포).

**User Advocate** — 카피·면책·출처·판정색 의미 고정·접근성 유지. 빈/로딩/에러/성공 상태 카피 확정.

**Devil's Advocate (마지막, 최종 게이트)** —
- **금지선 재확인**: 브랜드/제품명 추천 절대 금지(프롬프트+normalize 필터+smoke 체크). 위반 시 전체 신뢰 붕괴.
- 추천도 **근거 없으면 INSUFFICIENT**(검증과 동일 정직 게이트). candidateTypes는 **시드 근거 있을 때만**.
- 과한 안심 카피 완화. 면책 인라인. 출처 칩 필수.
- 16:30 이후 기능 동결. 시간 부족 시 candidateTypes부터 CUT.
- **최종: KEEP 승인.** 조건: (a) 브랜드 금지 3중 가드, (b) 추천 INSUFFICIENT 규율, (c) 트레이드오프쌍·출처·면책,
  (d) 표현 완화 — 4조건 충족 시 구현.

---

## Vote / Closure

| Role | Vote | Condition or objection |
| --- | --- | --- |
| PM | agree | 가치 재정의(구매 전 결정), 최소 슬라이스 |
| Tech Lead | agree | /api/brief 확장만, 새 서비스 0 |
| User Advocate | conditional | 제안형 카피·출처칩·과신 방지 |
| CEO | agree | "구매 코치" 데모 서사 |
| Devil's Advocate | conditional → resolved | 브랜드 금지 3중가드·추천 INSUFFICIENT·트레이드오프쌍·표현완화 (FIX/ACCEPT) |

Consensus: PM·Tech Lead·User Advocate ≥ conditional, Devil 조건 FIX/ACCEPT → **KEEP**.

---

## Wiki Updates

| Page | Add / update |
| --- | --- |
| Problem | 페인 무게중심을 "구매 후 검증"→"**구매 전 결정(무엇을·어떤 기준으로 살까)**"으로 이동 |
| Users | 동일(초보 부모) + "매장/장바구니 앞에서 결정 못 하는 순간" 명시 |
| Features | (kept) 구매 결정 브리프: 추천 사양·피할 것·(조건부)후보 유형·매장 확인 체크리스트·개인화 칩 |
| Risks | R-추천보증(브랜드 추천=책임/신뢰 붕괴) · R-추천환각(무근거 사양) · R-과신(맞춤이 과한 안심) |
| Decisions | D6 "구매 전 결정 지원"으로 재정의; 브랜드=금지, 유형=트레이드오프쌍, 사양=확인항목; 추천도 INSUFFICIENT 규율 |
| Open Questions | 후보 유형 근거 데이터 확충 범위 / 예산축 도입 여부 / 제품 DB(B1·B6) 도입 시점 |
| Error Book | (이전 가정) "검증 체크리스트면 충분" → 부모 페인은 *구매 전 결정*이었음(보정) |

---

## Graph Updates

| Source | Edge | Target | Confidence |
| --- | --- | --- | --- |
| Requirement(구매 전 결정) | requires | Feature(구매 결정 브리프) | EXTRACTED(사용자) |
| Feature(구매 결정 브리프) | serves | Pain(뭘 사야 할지 모름) | EXTRACTED |
| Feature(추천 사양) | uses | CopilotSDK(/api/brief) | INFERRED |
| CopilotSDK | implements | API(/api/brief recommendation) | INFERRED |
| Feature | implements | Screen("이렇게 사면 안심" 블록 + 칩) | INFERRED |
| Risk(브랜드 추천=보증) | blocks | Feature(추천) | EXTRACTED |
| Decision(브랜드 금지 3중가드) | resolves | Risk(브랜드 추천) | INFERRED |
| Risk(추천 환각) | blocks | Feature(추천) | EXTRACTED |
| Decision(추천 INSUFFICIENT 규율) | resolves | Risk(추천 환각) | INFERRED |
| SmokeTest(브랜드 미포함·추천필드) | verifies | Feature(추천) | AMBIGUOUS(예정) |
| Decision(vanilla·DB 미도입) | defers | Vision(제품DB·브랜드·커머스) | EXTRACTED |

---

## Keep / Cut / Defer / Must Test

| Item | Decision | Reason |
| --- | --- | --- |
| 가치 재정의: 구매 전 결정 지원 | KEEP | 사용자 핵심 페인 직답 |
| recommendedSpec(추천 사양+이유+확인처) | KEEP | "무엇을 사라"를 매장 확인으로 연결 |
| avoid(피해야 할 신호) | KEEP | 결정의 반대편, 환각 위험 낮음 |
| inStoreChecklist(매장 확인) | KEEP | 구매 *전* 검증, 정직 |
| candidateTypes(유형 트레이드오프) | KEEP(조건부) | **시드 근거 있을 때만**, ≤3, pros/cons쌍, 순위금지 |
| 개인화 칩(연령/맥락/우려) ≤3, 선택 | KEEP | 맞춤감, 미입력도 동작 |
| 브랜드/제품명 추천 | CUT(금지) | 책임·신뢰 붕괴(3중 가드로 차단) |
| 가격/커머스·별점·정렬 | DEFER | 데이터 없음, 편향 위험 |
| 실제 제품 DB(B1·B6) | DEFER | 정공법이나 범위 밖 |
| 예산 정밀축 | DEFER | 가격 DB 부재 |
| 브랜드 미포함·추천 필드·빈값 규율 | MUST TEST | Devil 최종 게이트 |

---

## Smallest Vertical Slice
- User: 초보 부모, 아직 *구매 전*(무엇을 살지 미정)
- Action: (선택) 연령/맥락/우려 칩 탭 + 우려 입력 → "안전 구매 기준 받기" → **"이렇게 사면 안심" 사양/피할 것/매장 확인**
- Screen: 브리프 패널 상단 추천 블록(추천 사양 리스트 + 피할 것 + (조건부)후보 유형 카드) + 칩, 하단 기존 근거/체크리스트
- Data/API: 기존 `POST /api/brief` 확장(출력에 `recommendation`); `GET /api/guide` 모달에 "구매 기준" 미니섹션
- Copilot SDK use: 컨텍스트(텍스트+칩) → 구매 결정 규칙 프롬프트 → 구조화 추천 JSON(브랜드 금지·출처 필수)
- Smoke: unit(normalize 신규필드·fallback 유형추천·브랜드토큰 미포함) · api(/api/brief에 recommendation) ·
  browser(추천 블록 렌더·칩·가이드 미니섹션·375/768/1280) · 로컬 real-SDK(추천 생성)
- Azure deploy path: 변경 없음(vanilla 단일 서비스 재배포)

## Handoff Prompt
Use lipcoding-loop / warm-editorial-ui to implement:
"`/api/brief` 출력에 `recommendation { spec[ {item, why, checkAt} ], avoid[], candidateTypes[ {type, pros[], cons[], bestFor} ] }`
추가. 프롬프트 규칙: 브랜드/제품명 금지, 유형은 장단점쌍·순위 금지, 사양은 '매장 확인 항목'으로, 근거 없으면
추천 생략·INSUFFICIENT, 각 항목 출처. normalize에서 브랜드 의심·빈값 드롭, 상한 적용. fallback은 CASE_NOTES에
유형/사양 힌트 추가해 동일 스키마 생성(시드 밖이면 일반 기준+INSUFFICIENT). UI: 결과 상단 '이렇게 사면 (더 안전한
선택에 가까워져요)' 블록(추천 사양·피할 것·(조건부)후보 유형) + 연령/맥락/우려 칩 3개(선택), 가이드 모달에 '구매 기준'
미니섹션. 면책 인라인·출처칩·판정색 의미 고정·100% 한국어·375/768/1280 반응형. smoke에 '브랜드명 미포함' 체크 추가."

## Kill Rules
- SDK/normalize가 브랜드명을 노출하면 즉시 차단(가드 강화 전 배포 금지).
- candidateTypes가 무근거 환각이면 그 필드 CUT(시드 근거 주제만).
- 추천 블록이 모달/반응형 깨면 배포 금지(smoke 강제).
- 16:30 KST 이후 신규기능 동결.
