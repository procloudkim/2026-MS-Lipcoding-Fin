// 네트워크 비의존 단위 smoke. lib.js 핵심 로직 검증.
import {
  buildPlanPrompt,
  buildAssistPrompt,
  parseJson,
  normalizePlan,
  normalizeArtifact,
  fallbackPlan,
  fallbackArtifact,
  VERDICTS,
} from "../lib.js";

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

const sample = [
  "분기 보고서 초안 쓰기",
  "팀 회의 자료 준비",
  "저녁에 운동 30분",
  "부모님께 전화",
  "세금 서류 확인",
  "언젠가 사이드 프로젝트 구경",
].join("\n");

// 프롬프트
const p = buildPlanPrompt(sample);
check("buildPlanPrompt 입력 포함", p.includes("세금 서류 확인"));
check("buildPlanPrompt verdict 안내 포함", p.includes("DO_NOW") && p.includes("DROP"));
check("buildAssistPrompt type 반영", buildAssistPrompt("회의 준비", "agenda").includes("회의 안건"));

// 파서 + normalizePlan
const raw =
  "```json\n" +
  JSON.stringify({
    headline: "핵심부터",
    decisions: [
      { item: "보고서", verdict: "DO_NOW", why: "마감", when: "오전" },
      { item: "잡일", verdict: "drop", why: "가치 낮음" },
      { item: "잘못된", verdict: "WAT", why: "x" },
    ],
    timeline: [{ time: "09:00", block: "보고서", focus: "집중" }],
    firstArtifact: { forItem: "보고서", type: "outline", title: "보고서 개요", content: "- 요지" },
    amplify: { decisionsMade: 3, artifactsDrafted: 1, minutesSaved: 30 },
  }) +
  "\n```";
const plan = normalizePlan(parseJson(raw));
check("normalizePlan 파싱", !!plan && plan.decisions.length === 3);
check("normalizePlan 잘못된 verdict 보정", plan.decisions[2].verdict === "SCHEDULE");
check("normalizePlan drop 대문자화", plan.decisions[1].verdict === "DROP");
check("normalizePlan verdictKo 부여", plan.decisions[0].verdictKo === "지금 바로");
check("normalizePlan firstArtifact", !!plan.firstArtifact && plan.firstArtifact.type === "outline");
check("parseJson 잘못된 입력 null", parseJson("not json") === null);

// normalizeArtifact
const art = normalizeArtifact({ type: "email", title: "안내", content: "본문" });
check("normalizeArtifact", !!art && art.type === "email" && art.typeKo === "이메일 초안");
check("normalizeArtifact 빈 content null", normalizeArtifact({ type: "email", content: "" }) === null);

// fallbackPlan
const fb = fallbackPlan(sample);
check("fallbackPlan headline 존재", typeof fb.headline === "string" && fb.headline.length > 0);
check("fallbackPlan decisions 존재", fb.decisions.length >= 5);
check("fallbackPlan verdict 유효", fb.decisions.every((d) => VERDICTS.includes(d.verdict)));
check("fallbackPlan 첫 항목 DO_NOW", fb.decisions[0].verdict === "DO_NOW");
check("fallbackPlan 결정 덜어냄(DROP/DEFER/DELEGATE 존재)", fb.decisions.some((d) => ["DROP", "DEFER", "DELEGATE"].includes(d.verdict)));
check("fallbackPlan timeline 존재", fb.timeline.length >= 1);
check("fallbackPlan firstArtifact 존재", !!fb.firstArtifact && fb.firstArtifact.content.length > 0);
check("fallbackPlan amplify 일관", fb.amplify.decisionsMade === fb.decisions.length);

// fallbackArtifact 타입 추론
check("fallbackArtifact 회의->agenda", fallbackArtifact("팀 회의 준비").type === "agenda");
check("fallbackArtifact 메일->email", fallbackArtifact("고객에게 메일 답장").type === "email");

if (failures > 0) {
  console.error(`\nSMOKE FAIL: ${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nSMOKE PASS: all checks passed.");
