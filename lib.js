// 안심육아 브리프 — 핵심 로직 (네트워크 비의존). server.js + smoke 재사용.
// 판매/인기 대신 공신력·의학·환경호르몬 근거로 육아템 안전 결정을 돕는다.
// 정직성 규칙: 특정 제품의 시험결과를 단정하지 않는다. 모르면 INSUFFICIENT.

export const VERDICTS = ["SAFE", "CAUTION", "WARN", "INSUFFICIENT"];
export const VERDICT_KO = {
  SAFE: "안심",
  CAUTION: "주의",
  WARN: "경고",
  INSUFFICIENT: "정보부족",
};

export const AXES = ["chemical", "physical", "certification", "hygiene"];
export const AXIS_KO = {
  chemical: "화학",
  physical: "물리",
  certification: "인증",
  hygiene: "위생",
};
const AXIS_FROM_KO = { 화학: "chemical", 물리: "physical", 인증: "certification", 위생: "hygiene" };
export const LEVELS = ["ok", "caution", "warn", "unknown"];
export const STAGES = ["신생아", "영아", "유아"];
const FITS = ["적합", "주의", "부적합"];

export const DISCLAIMER =
  "본 도구는 의학적 진단·안전성 보증이 아닙니다. 판정은 결정지원 정보이며, 최종 구매 전 표시된 공신력 출처(식약처·소아과학회 등)에서 직접 확인하세요.";

// ---------- Seed: MECE 카테고리 ----------
export const CATEGORIES = [
  { id: "feeding", name: "수유", icon: "🍼",
    items: ["젖병", "노리개젖꼭지(쪽쪽이)", "젖꼭지", "분유", "유축기", "이유식 용기"],
    issues: ["BPA·환경호르몬", "고온소독 변형", "질식"] },
  { id: "hygiene", name: "위생/목욕", icon: "🧼",
    items: ["물티슈", "기저귀", "바디워시/샴푸", "보습로션", "구강티슈"],
    issues: ["유해 보존제", "피부자극", "식약처 분류"] },
  { id: "sleep", name: "수면", icon: "🛏️",
    items: ["아기침대", "매트리스", "속싸개", "수면조끼"],
    issues: ["질식·SIDS", "VOC", "KC 안전기준"] },
  { id: "mobility", name: "이동/외출", icon: "🚗",
    items: ["카시트", "유모차", "아기띠"],
    issues: ["충돌안전(KC)", "끼임", "고관절"] },
  { id: "play", name: "놀이/발달", icon: "🧸",
    items: ["치발기", "모빌", "장난감"],
    issues: ["프탈레이트(PVC)", "소형부품 삼킴", "EN71"] },
  { id: "environment", name: "환경", icon: "🌫️",
    items: ["공기청정기", "가습기", "세탁세제"],
    issues: ["살균제 흡입위험", "잔류성분"] },
];

// ---------- Seed: 안전축 ----------
export const SAFETY_AXES = [
  { id: "chemical", name: "화학", keywords: ["bpa", "비스페놀", "프탈레이트", "환경호르몬", "중금속", "납", "카드뮴", "voc", "포름알데히드"] },
  { id: "physical", name: "물리", keywords: ["질식", "삼킴", "소형부품", "끼임", "날카", "전복", "kc"] },
  { id: "certification", name: "인증", keywords: ["kc", "식약처", "fda", "ce", "en71", "인증", "성적서"] },
  { id: "hygiene", name: "위생", keywords: ["소재", "소독", "세척", "곰팡이", "실리콘"] },
];

// ---------- Seed: 공신력 출처 ----------
export const TRUSTED_SOURCES = [
  { id: "mfds", name: "식약처(MFDS)", type: "정부", why: "의약외품·화장품·위생용품 분류와 회수·안전정보 확인", url: "https://www.mfds.go.kr", match: ["식약처", "mfds", "식품의약품안전처"] },
  { id: "kca", name: "한국소비자원", type: "정부", why: "안전성 비교시험·리콜·위해정보 확인", url: "https://www.kca.go.kr", match: ["소비자원", "kca"] },
  { id: "kc", name: "국가기술표준원 / KC 인증", type: "정부", why: "어린이제품 KC 마크·시험성적서·리콜 확인", url: "https://www.safetykorea.kr", match: ["kc", "국가기술표준원", "제품안전", "safetykorea"] },
  { id: "kpa", name: "대한소아청소년과학회", type: "학회", why: "수유·수면 등 의학적 권고 확인", url: "https://www.pediatrics.or.kr", match: ["소아청소년과", "소아과", "pediatric"] },
  { id: "ha", name: "하정훈의 삐뽀삐뽀119(소아청소년과 전문의)", type: "유튜브", why: "육아 의학 정보 참고", url: "https://www.youtube.com/results?search_query=%EC%82%90%EB%BF%90%EC%82%90%EB%BF%90119", match: ["삐뽀", "하정훈"] },
  { id: "momtok", name: "맘톡TV", type: "유튜브", why: "육아 정보 참고", url: "https://www.youtube.com/results?search_query=%EB%A7%98%ED%86%A1TV", match: ["맘톡"] },
  { id: "fda", name: "FDA(미국)", type: "해외", why: "food-contact·BPA 규제 참고", url: "https://www.fda.gov", match: ["fda"] },
  { id: "en71", name: "EU 안전게이트 / EN71(완구안전)", type: "해외", why: "완구 화학·물리 안전 표준·리콜 확인", url: "https://ec.europa.eu/safety-gate-alerts", match: ["en71", "안전게이트", "safety gate", "eu"] },
];
const SOURCE_BY_ID = Object.fromEntries(TRUSTED_SOURCES.map((s) => [s.id, s]));

// SDK가 돌려준 출처 이름에 공식 URL을 붙인다(이름 토큰 매칭).
function attachSourceUrl(name) {
  const n = norm(name);
  if (!n) return "";
  const hit = TRUSTED_SOURCES.find((s) => s.match.some((m) => n.includes(norm(m))));
  return hit ? hit.url : "";
}

// ---------- Seed: 사례 메모(정직 프레이밍 — 단정 금지) ----------
export const CASE_NOTES = [
  {
    id: "bpa",
    match: ["bpa", "비스페놀", "환경호르몬", "젖병", "쪽쪽이", "노리개", "젖꼭지", "아벤트", "아벤뜨", "필립스"],
    verdictHint: "CAUTION",
    topic: "비스페놀A(BPA) 등 환경호르몬",
    summary: "입에 닿는 제품은 BPA-free 표시·KC 인증·최신 시험성적서를 확인해야 합니다.",
    infoGaps: [
      "인증 시점·기관·국가가 다르면(예: 해외 시험 vs 국내 KC 인증 연도) 정보 간극이 생깁니다.",
      "보도된 우려가 현재 유통 로트에도 해당하는지는 최신 시험성적서로만 확정할 수 있습니다.",
    ],
    checklist: [
      "제품의 KC 인증 연도와 시험성적서 발급일 확인",
      "판매처에 최신 비스페놀A·프탈레이트 시험성적서 요청",
      "식약처/소비자원 회수·안전정보에서 제품명 검색",
      "BPA-free·식품용 등급(PP/실리콘) 소재 표기 확인",
    ],
    sources: ["kc", "mfds", "kca", "fda"],
  },
  {
    id: "humidifier",
    match: ["가습기", "살균제", "가습"],
    verdictHint: "WARN",
    topic: "가습기 살균제 흡입 위험",
    summary: "가습기에는 살균제를 넣지 마세요. 과거 중대한 흡입 피해 사례가 있었습니다.",
    infoGaps: ["'살균·항균' 표기 가습기 첨가제의 흡입 안전성은 신뢰하기 어렵습니다."],
    checklist: [
      "가습기 물에 살균제·세정제를 절대 첨가하지 않기",
      "매일 물 교체 + 물리적 세척(솔)로 관리",
      "식약처/환경부 안전정보 확인",
    ],
    alternatives: ["살균제 대신 매일 물 교체·물리적 세척", "자연 가습(젖은 수건)·환기 병행"],
    sources: ["mfds", "kca"],
  },
  {
    id: "phthalate",
    match: ["프탈레이트", "치발기", "pvc", "장난감", "완구", "치아발육기", "모빌"],
    verdictHint: "CAUTION",
    topic: "프탈레이트(가소제) · 완구 안전",
    summary: "입에 무는 완구·치발기는 프탈레이트 용출 우려가 있어 인증·소재를 확인합니다.",
    infoGaps: ["저가 PVC 완구는 가소제 함량 정보가 부족할 수 있습니다."],
    checklist: [
      "KC 어린이제품 인증·EN71 표기 확인",
      "PVC 대신 실리콘·식품용 소재 우선",
      "소형부품 삼킴 위험(36개월 미만) 경고 표기 확인",
    ],
    sources: ["kc", "en71", "kca"],
  },
  {
    id: "carseat",
    match: ["카시트", "car seat", "유아용 시트", "부스터"],
    verdictHint: "CAUTION",
    topic: "카시트 충돌 안전 · 설치",
    summary: "카시트는 충돌 안전이 핵심이라 KC 또는 UN R129(i-Size) 인증과 올바른 설치가 중요합니다.",
    infoGaps: [
      "연령·신장·체중 기준이 제품마다 달라 적합 단계를 표기로 확인해야 합니다.",
      "중고/해외직구 제품은 국내 KC 인증·리콜 이력 확인이 어렵습니다.",
    ],
    checklist: [
      "KC 또는 UN R129(i-Size) 인증 표기 확인",
      "신생아·영아는 후방장착(뒤보기) 기준 기간 확인",
      "ISOFIX 또는 안전벨트 고정이 흔들림 없이 단단한지 확인",
      "제품안전정보센터·소비자원에서 리콜 이력 검색",
    ],
    sources: ["kc", "kca", "mfds"],
  },
  {
    id: "stroller",
    match: ["유모차", "stroller", "디럭스", "절충형", "휴대용 유모차"],
    verdictHint: "CAUTION",
    topic: "유모차 끼임·전복 안전",
    summary: "유모차는 끼임·전복·제동 안전과 KC 인증을 확인해야 합니다.",
    infoGaps: ["접이식 관절·브레이크 내구성은 사용 중 마모로 달라질 수 있습니다."],
    checklist: [
      "어린이제품 KC 인증 표기 확인",
      "5점식 안전벨트와 제동장치 작동 확인",
      "접이 관절 끼임 방지·잠금 확인",
      "제품안전정보센터·소비자원 리콜 이력 검색",
    ],
    sources: ["kc", "kca"],
  },
  {
    id: "wipes",
    match: ["물티슈", "wipes", "물수건", "구강티슈"],
    verdictHint: "CAUTION",
    topic: "물티슈 성분 · 보존제",
    summary: "물티슈는 보존제·향료 등 성분과 식약처 분류(화장품/위생용품)를 확인합니다.",
    infoGaps: [
      "같은 물티슈도 화장품용/위생용품 분류에 따라 규제 기준이 다릅니다.",
      "성분 표시가 제품 갱신 시 바뀔 수 있어 최신 전성분 확인이 필요합니다.",
    ],
    checklist: [
      "식약처 분류(화장품/위생용품)와 전성분 표시 확인",
      "메칠이소치아졸리논(MIT/CMIT) 등 우려 보존제 여부 확인",
      "무향·무알코올·약산성 표기 확인",
      "식약처·소비자원 회수/안전정보에서 제품명 검색",
    ],
    sources: ["mfds", "kca"],
  },
  {
    id: "skincare",
    match: ["로션", "보습", "크림", "화장품", "바디워시", "샴푸", "오일", "선크림", "스킨"],
    verdictHint: "CAUTION",
    topic: "유아 화장품(로션·워시 등) 성분",
    summary: "피부에 닿는 제품은 식약처 화장품 기준과 알레르겐·자극 성분을 확인합니다.",
    infoGaps: ["'유아용' 표기가 곧 무자극을 보증하지는 않으며 개별 피부 반응은 다릅니다."],
    checklist: [
      "식약처 화장품 책임판매업 등록·전성분 확인",
      "향료·색소·알레르겐 유발 성분 최소화 제품 선택",
      "처음엔 소량 패치 테스트 후 사용",
      "식약처·소비자원 회수/안전정보에서 제품명 검색",
    ],
    sources: ["mfds", "kca", "kpa"],
  },
  {
    id: "sleep",
    match: ["수면", "속싸개", "베개", "아기침대", "매트리스", "범퍼침대", "수면조끼", "이불", "sids"],
    verdictHint: "CAUTION",
    topic: "안전한 수면 환경 · SIDS 예방",
    summary: "영아 돌연사(SIDS) 예방을 위해 제품 자체보다 '재우는 방식'이 더 중요합니다.",
    infoGaps: ["푹신한 침구·범퍼·인형의 위험은 제품 인증과 별개로 사용 환경에서 발생합니다."],
    checklist: [
      "단단한 매트리스에 등을 대고(똑바로) 재우기",
      "침대 안 푹신한 이불·베개·인형·범퍼 제거",
      "속싸개는 고관절 여유·과열 주의, 뒤집기 시작 시 중단",
      "어린이제품 KC 인증·소아청소년과학회 안전수면 권고 확인",
    ],
    alternatives: ["범퍼·베개 대신 빈 아기침대(베어 크립)", "수면조끼로 이불 대체"],
    sources: ["kpa", "kc", "kca"],
  },
  {
    id: "powder",
    match: ["베이비파우더", "파우더", "탈크", "talc", "땀띠분"],
    verdictHint: "CAUTION",
    topic: "베이비파우더 흡입 · 탈크 우려",
    summary: "분말 흡입 위험과 탈크 원료 우려가 있어 사용 방식·원료를 확인합니다.",
    infoGaps: ["탈크/녹말 원료와 흡입 위험에 대한 평가가 제품·기관마다 다를 수 있습니다."],
    checklist: [
      "아기 얼굴 근처에서 직접 털지 않기(흡입 위험)",
      "탈크 free·옥수수전분(콘스타치) 원료 여부 확인",
      "식약처 화장품/위생용품 분류·전성분 확인",
    ],
    alternatives: ["분말 대신 통풍·건조로 땀띠 관리", "콘스타치 기반 제품"],
    sources: ["mfds", "kca", "fda"],
  },
  {
    id: "diaper",
    match: ["기저귀", "diaper", "팬티기저귀", "밴드형"],
    verdictHint: "CAUTION",
    topic: "기저귀 성분 · 피부 안전",
    summary: "기저귀는 흡수제·향료·형광증백제 등 성분과 발진 관리가 쟁점입니다.",
    infoGaps: ["제품 갱신으로 소재·성분이 바뀔 수 있어 최신 정보 확인이 필요합니다."],
    checklist: [
      "식약처 위생용품 표시·전성분 확인",
      "무향·형광증백제 무첨가 표기 확인",
      "발진 시 자주 교체·통풍, 증상 지속 시 소아과 상담",
      "식약처·소비자원 회수/안전정보에서 제품명 검색",
    ],
    sources: ["mfds", "kca"],
  },
];

// ---------- 유틸 ----------
function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function str(v) {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}
function norm(s) {
  return String(s || "").toLowerCase();
}

export function matchCategory(query) {
  const q = norm(query);
  if (!q) return null;
  for (const c of CATEGORIES) {
    if (q.includes(norm(c.name))) return c;
    for (const it of c.items) {
      const full = norm(it);
      const base = norm(it.replace(/\(.*?\)/g, "")); // 괄호 밖 표기
      const inside = norm((it.match(/\((.*?)\)/) || [])[1] || ""); // 괄호 안 별칭(예: 쪽쪽이)
      if (full && q.includes(full)) return c;
      if (base && q.includes(base)) return c;
      if (inside && q.includes(inside)) return c;
    }
  }
  return null;
}

export function matchCases(query) {
  const q = norm(query);
  if (!q) return [];
  return CASE_NOTES.filter((c) => c.match.some((m) => q.includes(norm(m))));
}

function resolveSources(ids) {
  return asArray(ids)
    .map((id) => SOURCE_BY_ID[id])
    .filter(Boolean)
    .map((s) => ({ name: s.name, why: s.why, url: s.url || "" }));
}

// ---------- 프롬프트 ----------
export const BRIEF_SCHEMA = `{
  "product": string,                       // 정규화한 대상(제품/카테고리)
  "category": string,                      // 카테고리 추정
  "verdict": "SAFE|CAUTION|WARN|INSUFFICIENT",
  "verdictReason": string,                 // 판정 근거 한 문장
  "ageFit": [ { "stage": "신생아|영아|유아", "fit": "적합|주의|부적합", "note": string } ],
  "evidence": [ { "axis": "화학|물리|인증|위생", "finding": string, "level": "ok|caution|warn|unknown" } ],
  "infoGaps": [ string ],                  // 정보 간극(인증 시점/기관/국가 차이 등)
  "checklist": [ string ],                 // 구매 전 확인 행동
  "sources": [ { "name": string, "why": string } ],
  "alternatives": [ string ]               // 경고 시 대안 방향(없으면 빈 배열)
}`;

export function buildBriefPrompt(query) {
  const cat = matchCategory(query);
  const cases = matchCases(query);
  const sourceList = TRUSTED_SOURCES.map((s) => `- ${s.name}(${s.type}): ${s.why}`).join("\n");
  const caseCtx = cases.length
    ? cases.map((c) => `- ${c.topic}: ${c.summary} (정보간극: ${c.infoGaps.join(" / ")})`).join("\n")
    : "(매칭된 사례 없음)";
  return [
    "당신은 초보 부모를 돕는 '안심육아' 안전 브리프 에이전트입니다.",
    "판매량·인기·가격이 아니라 공신력 기관·의학·환경호르몬 근거로 안전성을 정리합니다.",
    "",
    "정직성 규칙(중요):",
    "- 특정 제품의 시험결과(BPA 검출 여부 등)를 단정하지 마세요. 근거가 부족하면 verdict는 INSUFFICIENT.",
    "- 인증 시점/기관/국가가 다른 '정보 간극'을 infoGaps에 구체적으로 적으세요.",
    "- 판정은 결정지원이며 의학적 보증이 아닙니다. 무엇을 어디서 확인할지(checklist, sources)를 제시하세요.",
    "- 모든 텍스트는 한국어.",
    "",
    "판정 기준: SAFE(안심)=공인 인증·근거 충분 / CAUTION(주의)=확인 필요한 쟁점 존재 / WARN(경고)=알려진 위험 / INSUFFICIENT(정보부족)=근거 불충분.",
    "연령 단계: 신생아(0~1개월), 영아(~12개월), 유아(~36개월) 각각에 대해 ageFit을 적으세요.",
    "안전축은 화학·물리·인증·위생 중 해당되는 항목을 evidence에 담으세요.",
    "",
    `대상 카테고리(추정): ${cat ? cat.name + " — 쟁점: " + cat.issues.join(", ") : "미상"}`,
    "참고 공신력 출처:",
    sourceList,
    "관련 사례 메모:",
    caseCtx,
    "",
    "아래 JSON 스키마만 출력하세요. 코드펜스/설명/인사말 없이 JSON만.",
    BRIEF_SCHEMA,
    "",
    "부모의 질문/제품:",
    query,
  ].join("\n");
}

// ---------- 파서 + 정규화 ----------
export function parseJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function normVerdict(v) {
  const x = str(v).toUpperCase().replace(/[^A-Z]/g, "");
  return VERDICTS.includes(x) ? x : "INSUFFICIENT";
}
function normLevel(v) {
  const x = norm(v).replace(/[^a-z]/g, "");
  return LEVELS.includes(x) ? x : "unknown";
}
function normAxis(v) {
  const raw = str(v);
  if (AXES.includes(norm(raw))) return norm(raw);
  if (AXIS_FROM_KO[raw]) return AXIS_FROM_KO[raw];
  const hit = SAFETY_AXES.find((a) => raw.includes(a.name));
  return hit ? hit.id : "chemical";
}
function normFit(v) {
  const x = str(v);
  return FITS.includes(x) ? x : "주의";
}

export function normalizeBrief(obj) {
  if (!obj || typeof obj !== "object") return null;

  const verdict = normVerdict(obj.verdict);

  const ageFit = asArray(obj.ageFit)
    .map((a) => ({
      stage: STAGES.includes(str(a?.stage)) ? str(a.stage) : "",
      fit: normFit(a?.fit),
      note: str(a?.note),
    }))
    .filter((a) => a.stage)
    .slice(0, 3);

  const evidence = asArray(obj.evidence)
    .map((e) => {
      const axis = normAxis(e?.axis);
      return { axis, axisKo: AXIS_KO[axis], finding: str(e?.finding), level: normLevel(e?.level) };
    })
    .filter((e) => e.finding)
    .slice(0, 8);

  const infoGaps = asArray(obj.infoGaps).map(str).filter(Boolean).slice(0, 6);
  const checklist = asArray(obj.checklist).map(str).filter(Boolean).slice(0, 8);
  const alternatives = asArray(obj.alternatives).map(str).filter(Boolean).slice(0, 5);

  const sources = asArray(obj.sources)
    .map((s) => {
      const name = str(s?.name);
      return { name, why: str(s?.why), url: str(s?.url) || attachSourceUrl(name) };
    })
    .filter((s) => s.name)
    .slice(0, 8);

  const product = str(obj.product);
  if (!product && !evidence.length && !checklist.length) return null;

  return {
    product: product || "입력한 육아템",
    category: str(obj.category),
    verdict,
    verdictKo: VERDICT_KO[verdict],
    verdictReason: str(obj.verdictReason) || "공신력 출처 확인이 필요한 항목입니다.",
    ageFit,
    evidence,
    infoGaps,
    checklist,
    sources,
    alternatives,
  };
}

// ---------- 결정적 fallback (SDK 미연결 시에도 리치 결과) ----------

const AXIS_FINDING = {
  chemical: { finding: "BPA·프탈레이트 등 환경호르몬은 BPA-free 표기와 시험성적서로 확인하세요.", level: "caution" },
  physical: { finding: "질식·끼임·소형부품 삼킴 위험과 KC 안전기준 표기를 확인하세요.", level: "caution" },
  certification: { finding: "KC 어린이제품 인증·식약처 분류·시험성적서 발급일을 확인하세요.", level: "unknown" },
  hygiene: { finding: "소재(실리콘·식품용)·세척/소독 방법과 곰팡이 관리를 확인하세요.", level: "ok" },
};

function ageFitFor(cat) {
  const note = cat
    ? `${cat.name} 제품은 연령 단계 표기와 인증을 확인하세요.`
    : "연령 단계 표기와 KC 인증을 확인하세요.";
  const small = "36개월 미만은 소형부품 삼킴·질식 위험에 특히 주의하세요.";
  return [
    { stage: "신생아", fit: "주의", note: cat && cat.id === "feeding" ? "신생아용 단계(느린 유속) 젖꼭지·소독 가능 소재 확인." : note },
    { stage: "영아", fit: "주의", note: small },
    { stage: "유아", fit: "주의", note: note },
  ];
}

export function fallbackBrief(query) {
  const q = str(query);
  const cat = matchCategory(q);
  const cases = matchCases(q);

  if (!q) {
    return {
      product: "",
      category: "",
      verdict: "INSUFFICIENT",
      verdictKo: VERDICT_KO.INSUFFICIENT,
      verdictReason: "확인할 제품이나 우려를 입력하면 안전 브리프를 만들어 드립니다.",
      ageFit: [],
      evidence: [],
      infoGaps: [],
      checklist: [],
      sources: [],
      alternatives: [],
    };
  }

  // verdict 결정
  let verdict = "INSUFFICIENT";
  if (cases.some((c) => c.verdictHint === "WARN")) verdict = "WARN";
  else if (cases.length || cat) verdict = "CAUTION";

  // 안전축 evidence: 카테고리 쟁점 + 매칭된 사례 키워드 기반
  const axisIds = new Set(["certification"]);
  if (cat) {
    const text = norm(cat.issues.join(" "));
    if (/bpa|환경호르몬|프탈|중금속/.test(text)) axisIds.add("chemical");
    if (/질식|끼임|충돌|삼킴|kc/.test(text)) axisIds.add("physical");
    if (/소재|위생|세척|곰팡/.test(text)) axisIds.add("hygiene");
  }
  cases.forEach((c) => {
    if (["bpa", "phthalate", "wipes", "skincare", "powder", "diaper"].includes(c.id)) axisIds.add("chemical");
    if (["carseat", "stroller", "sleep", "phthalate"].includes(c.id)) axisIds.add("physical");
    if (["humidifier", "wipes", "diaper", "skincare"].includes(c.id)) axisIds.add("hygiene");
  });
  if (axisIds.size === 1) {
    axisIds.add("chemical");
    axisIds.add("physical");
  }
  const evidence = [...axisIds].map((id) => ({
    axis: id,
    axisKo: AXIS_KO[id],
    finding: AXIS_FINDING[id].finding,
    level: verdict === "WARN" && id === "hygiene" ? "warn" : AXIS_FINDING[id].level,
  }));

  // 체크리스트 / 정보간극 / 출처 / 대안: 사례 우선, 없으면 기본
  const checklist = [];
  const infoGaps = [];
  const altSet = [];
  const sourceIds = new Set();
  cases.forEach((c) => {
    (c.checklist || []).forEach((x) => checklist.push(x));
    (c.infoGaps || []).forEach((x) => infoGaps.push(x));
    (c.alternatives || []).forEach((x) => altSet.push(x));
    (c.sources || []).forEach((id) => sourceIds.add(id));
  });
  if (!checklist.length) {
    checklist.push(
      "KC 어린이제품 인증·식약처 분류 표기 확인",
      "최신 시험성적서(발급일) 판매처에 요청",
      "식약처·한국소비자원 회수/안전정보에서 제품명 검색",
      cat ? `${cat.name} 공통 쟁점(${cat.issues.join(", ")}) 점검` : "소재·연령 적합성 표기 확인"
    );
  }
  infoGaps.push(
    "오프라인 근거 엔진은 실시간 인증·회수 조회를 수행하지 않으므로, 최종 확인은 아래 공신력 출처에서 직접 하세요."
  );
  ["kc", "mfds", "kca", "kpa"].forEach((id) => sourceIds.add(id));
  const sources = resolveSources([...sourceIds]);

  const product = q.slice(0, 60);
  const verdictReason =
    verdict === "WARN"
      ? "알려진 위험 사례가 있어 사용 전 강한 주의가 필요합니다."
      : verdict === "CAUTION"
      ? "안전을 단정할 수 없어 공인 인증과 시험성적서 확인이 필요합니다."
      : "근거가 부족합니다. 제품명·카테고리를 구체적으로 입력하거나 공신력 출처에서 확인하세요.";

  return {
    product,
    category: cat ? cat.name : "",
    verdict,
    verdictKo: VERDICT_KO[verdict],
    verdictReason,
    ageFit: cat || cases.length ? ageFitFor(cat) : [],
    evidence,
    infoGaps: [...new Set(infoGaps)].slice(0, 6),
    checklist: [...new Set(checklist)].slice(0, 8),
    sources,
    alternatives: [...new Set(altSet)].slice(0, 5),
  };
}

// 카테고리 트리(탐색 UI + MECE 구조 증거)
export function categoryTree() {
  return {
    categories: CATEGORIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon, items: c.items, issues: c.issues })),
    axes: SAFETY_AXES.map((a) => ({ id: a.id, name: a.name })),
    sources: TRUSTED_SOURCES.map((s) => ({ name: s.name, type: s.type, why: s.why, url: s.url })),
  };
}
