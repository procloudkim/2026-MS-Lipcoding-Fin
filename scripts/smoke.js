// 네트워크 비의존 단위 smoke. lib.js 핵심 로직 검증.
import {
  buildBriefPrompt,
  parseJson,
  normalizeBrief,
  fallbackBrief,
  matchCategory,
  matchCases,
  categoryTree,
  VERDICTS,
  AXES,
  STAGES,
} from "../lib.js";

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

// ---- 매칭 ----
check("matchCategory 젖병->수유", matchCategory("신생아 젖병 환경호르몬 걱정")?.id === "feeding");
check("matchCategory 가습기->환경", matchCategory("아기방 가습기 안전?")?.id === "environment");
check("matchCategory 무관입력 null", matchCategory("점심 메뉴 추천") === null);
check("matchCases BPA 키워드", matchCases("필립스 아벤트 쪽쪽이 비스페놀A").some((c) => c.id === "bpa"));
check("matchCases 가습기 살균제", matchCases("가습기 살균제").some((c) => c.id === "humidifier"));

// ---- 프롬프트 ----
const p = buildBriefPrompt("필립스 아벤트 쪽쪽이 비스페놀A 괜찮아?");
check("buildBriefPrompt 입력 포함", p.includes("필립스 아벤트"));
check("buildBriefPrompt 정직성 규칙 포함", p.includes("단정하지 마세요") && p.includes("INSUFFICIENT"));
check("buildBriefPrompt 스키마/출처 포함", p.includes("verdict") && p.includes("식약처"));

// ---- 파서 + normalizeBrief ----
const raw =
  "```json\n" +
  JSON.stringify({
    product: "필립스 아벤트 쪽쪽이",
    category: "수유",
    verdict: "caution",
    verdictReason: "확인 필요",
    ageFit: [
      { stage: "신생아", fit: "적합", note: "단계 확인" },
      { stage: "유아", fit: "주의", note: "치열" },
      { stage: "잘못", fit: "이상", note: "버려짐" },
    ],
    evidence: [
      { axis: "화학", finding: "BPA 확인 필요", level: "caution" },
      { axis: "인증", finding: "KC 연도 확인", level: "unknown" },
      { axis: "엉뚱", finding: "", level: "??" },
    ],
    infoGaps: ["KC 2023 vs 보도 시점 간극", ""],
    checklist: ["성적서 요청", ""],
    sources: [{ name: "식약처", why: "회수정보" }, { name: "", why: "x" }],
    alternatives: [],
  }) +
  "\n```";
const brief = normalizeBrief(parseJson(raw));
check("normalizeBrief 파싱", !!brief && brief.product === "필립스 아벤트 쪽쪽이");
check("normalizeBrief verdict 대문자/검증", brief.verdict === "CAUTION" && brief.verdictKo === "주의");
check("normalizeBrief ageFit 잘못된 stage 제거", brief.ageFit.length === 2);
check("normalizeBrief evidence 빈 finding 제거", brief.evidence.length === 2);
check("normalizeBrief axis 한글->id 매핑", brief.evidence[0].axis === "chemical" && brief.evidence[0].axisKo === "화학");
check("normalizeBrief 빈 항목 정리", brief.infoGaps.length === 1 && brief.checklist.length === 1 && brief.sources.length === 1);
check("parseJson 잘못된 입력 null", parseJson("not json") === null);
check("normalizeBrief 비객체 null", normalizeBrief(null) === null);

// ---- fallbackBrief ----
const fb = fallbackBrief("필립스 아벤트 쪽쪽이 비스페놀A 괜찮아?");
check("fallbackBrief verdict 유효", VERDICTS.includes(fb.verdict));
check("fallbackBrief BPA->CAUTION", fb.verdict === "CAUTION");
check("fallbackBrief 카테고리 수유", fb.category === "수유");
check("fallbackBrief evidence 화학 포함", fb.evidence.some((e) => e.axis === "chemical"));
check("fallbackBrief evidence axis 유효", fb.evidence.every((e) => AXES.includes(e.axis)));
check("fallbackBrief 정보간극 존재", fb.infoGaps.length >= 1);
check("fallbackBrief 체크리스트 존재", fb.checklist.length >= 2);
check("fallbackBrief 출처 존재", fb.sources.length >= 2 && fb.sources.every((s) => s.name));
check("fallbackBrief ageFit 3단계", fb.ageFit.length === 3 && fb.ageFit.every((a) => STAGES.includes(a.stage)));

const fbWarn = fallbackBrief("가습기 살균제 사용해도 될까");
check("fallbackBrief 가습기살균제->WARN", fbWarn.verdict === "WARN");
check("fallbackBrief WARN 대안 존재", fbWarn.alternatives.length >= 1);

const fbEmpty = fallbackBrief("");
check("fallbackBrief 빈입력 INSUFFICIENT", fbEmpty.verdict === "INSUFFICIENT" && fbEmpty.evidence.length === 0);

const fbUnknown = fallbackBrief("그냥 궁금한 일반 질문");
check("fallbackBrief 무관입력 INSUFFICIENT", fbUnknown.verdict === "INSUFFICIENT");

// ---- categoryTree ----
const tree = categoryTree();
check("categoryTree 6 카테고리(MECE)", tree.categories.length === 6);
check("categoryTree 안전축/출처 존재", tree.axes.length >= 4 && tree.sources.length >= 6);

if (failures > 0) {
  console.error(`\nSMOKE FAIL: ${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nSMOKE PASS: all checks passed.");
