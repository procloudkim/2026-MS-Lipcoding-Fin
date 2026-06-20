# 디자인 방향 (Design Director) — 육아 친화 Warm Editorial

## Design Direction State
- Source artifacts used: `research/decisions/debate-frontend-ux.md`(6라운드), `prep/llm-wiki/00-event-brief.md`,
  `research/briefs/data-flow-and-risks.md`, 현재 `public/`(vanilla).
- Selected vertical slice: 안심 가이드 서가(카드+필터) + 안전 주제 상세 모달 + 모달→AI 브리프 CTA + 육아 친화 리스타일.
- Time risk: 중간(모달 a11y/반응형 검증이 주 리스크). React는 DEFER로 제거.

## Product Metaphor
- Chosen metaphor: **editorial-desk + 라이브러리/서가**(큐레이션된 안전 체크포인트를 읽기 좋은 카드로 진열, 상세는 모달).
- Why this fits the MAS decision: 부모가 "고르거나(서가)·물어보거나(브리프)" 두 갈래. 데이터가 제품이 아니라
  **읽고 확인하는 지식**이므로 dashboard보다 editorial 진열이 적합. 모달=상세 리딩 표면.
- Rejected metaphor: `decision-room`(제품 비교/스코어카드) — 제품 DB가 없어 비교 불가(B6) → DEFER.
  `focus-studio`(타이머/딥워크) — 본 JTBD와 무관.

## Korean Product Surface
- App name candidate: **안심육아 브리프**(유지) · 서브: "안심 가이드 서가".
- One-line promise: "고르거나 물어보거나 — 공신력 근거로 육아템 안전을 확인하세요."
- Primary user: 신생아~유아 초보 부모(빈손 진입 포함).
- Main screen: 단일 페이지 — 얇은 헤더 / 안심 가이드 서가(카드 그리드 + 카테고리 필터) / "내 상황으로 물어보기" 브리프 패널.
- Primary action: 가이드 카드 열기(모달) · 브리프 생성(AI).
- Secondary actions: 카테고리 필터, 모달 내 "내 상황으로 물어보기", 출처 링크.
- Copilot SDK surface: 브리프 패널(직접 입력) + 모달 CTA(주제 프리필) → `POST /api/brief`.

## Screen Direction
| Screen / region | Purpose | Key Korean copy | Component pattern |
| --- | --- | --- | --- |
| 헤더(얇게) | 정체성·약속 | "안심육아 브리프 · 고르거나 물어보거나" | 브랜드 마크(작은 마스코트)+태그라인 |
| 카테고리 필터 | 서가 좁히기 | "전체 · 수유 · 위생/목욕 · 수면 · 이동/외출 · 놀이/발달 · 환경" | 둥근 칩 토글 |
| 가이드 서가(그리드) | 안전 주제 진열 | 카드: "젖병·쪽쪽이 — 환경호르몬 체크" + 판정색칩 | 카드 그리드(반복 아이템) |
| 주제 상세 모달 | 체크포인트 리딩 | "전문가 체크포인트 · 구매 전 확인 · 정보 간극 · 확인할 출처" | dialog + 섹션 리스트 |
| 모달 CTA | SDK 연결 | "내 상황으로 물어보기" | 레드 1차 버튼 |
| 브리프 패널 | AI 워크플로 | "이 육아템, 안전한가요?" 입력→판정/근거/체크리스트 | 입력+결과(기존 유지·리스타일) |
| 푸터 | 신뢰/면책 | "큐레이션 가이드이며 안전 보증이 아닙니다 · 서버 상태" | 얇은 바 |

## Visual System
| Token | Direction |
| --- | --- |
| Font | Pretendard Variable |
| Base | Warm beige (#f3eee3 계열) |
| Text | Ink (#1f1b16) |
| Accent | 단일 레드(#c5462e) = 1차 액션/경고 한 의미만 |
| 보조 톤 | 따뜻한 코랄/세이지(악센트로만, 판정색과 분리) |
| Radius | 카드/모달 12~14px, 칩 999px(친근·부드러움) |
| Density | 데스크톱 우선 생산성 밀도 + 넉넉한 여백(피곤한 부모) |
| 판정색(의미고정) | 안심=세이지그린 · 주의=황 · 경고=레드 · 정보부족=블루그레이 |
| 마스코트 | 브랜드 마크 1곳만(절제) |

## UX States
| State | Korean copy / behavior |
| --- | --- |
| Empty(서가) | 항상 카드가 있으므로 빈 상태 거의 없음. 필터 무결과 시 "해당 카테고리 가이드를 준비 중이에요." |
| Empty(브리프) | "왼쪽 가이드에서 고르거나, 여기에 제품·우려를 적어보세요." |
| Loading | 모달 CTA→브리프: "근거를 모아 정리하는 중…" 스피너 |
| Error | "브리프를 못 만들었어요. 잠시 후 다시 시도해주세요." + 재시도 |
| Success | 모달 닫고 브리프 패널에 결과 렌더 + source 배지(SDK/오프라인) |

## Design Graph Updates
| Source | Edge | Target | Confidence |
| --- | --- | --- | --- |
| Requirement(탐색성) | requires | Feature(가이드 서가) | INFERRED |
| Feature(가이드 서가) | serves | Persona(빈손 부모) | INFERRED |
| Feature(상세 모달) | serves | Pain(무엇을 확인할지 모름) | EXTRACTED(사용자 요청) |
| Feature(모달 CTA) | uses | CopilotSDK(/api/brief) | INFERRED |
| Screen(서가/모달) | implements | Feature(가이드) | INFERRED |
| API(/api/guide) | implements | Feature(서가) | INFERRED |
| SmokeTest(모달 a11y/반응형) | verifies | Feature(상세 모달) | AMBIGUOUS(검증 예정) |
| Risk(장식과잉→신뢰저하) | blocks | Feature(리스타일) | INFERRED |
| Decision(절제된 따뜻함) | resolves | Risk(장식과잉) | INFERRED |
| Decision(vanilla 유지) | defers | Vision(React/shadcn) | EXTRACTED(debate) |

## Handoff Prompt
Use lipcoding-warm-editorial-ui to implement:
"육아 친화 Warm Editorial(베이지/잉크/단일 레드 + 따뜻한 코랄 악센트, 12~14px 라운드, 작은 마스코트 1곳).
단일 페이지: 얇은 헤더 / 카테고리 필터 칩 / 안심 가이드 서가(카드 그리드, GET /api/guide) / 주제 상세 모달
(dialog, 포커스트랩·ESC·aria, 체크리스트·정보간극·출처링크, 하단 '내 상황으로 물어보기' CTA→/api/brief) /
브리프 패널(기존 유지·리스타일) / 면책 푸터. 판정색 의미 고정, 레드 단일 의미, 장식 절제, 100% 한국어,
375/768/1280/1920 반응형, 텍스트 겹침/잘림 없음."
