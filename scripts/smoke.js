// 네트워크 비의존 단위 smoke. lib.js 핵심 로직 검증.
import {
  buildPlanPrompt, buildAssistPrompt, parseJson,
  normalizePlan, normalizeArtifact, fallbackPlan, fallbackArtifact, VERDICTS,
} from "../lib.js";

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`PASS  ${name}`);
  else { failures += 1; console.error(`FAIL  ${name}`); }
}

const sample = [
  "분기 보고서 초안 쓰기", "팀 회의 자료 준비", "고객사에 회신 메일 보내기",
  "저녁에 운동 30분", "부모님께 전화", "세금 서류 확인", "언젠가 사이드 프로젝트 구경",
].join("\n");
const NOW = new Date(2026, 5, 20, 14, 0, 0); // 고정 시각으로 결정적 테스트

// 프롬프트
const p = buildPlanPrompt(sample, NOW);
check("buildPlanPrompt 입력 포함", p.includes("세금 서류 확인"));
check("buildPlanPrompt 입력순서 금지 안내", p.includes("입력된 순서를 그대로 따르지 마"));
check("buildPlanPrompt 현재시각 주입", p.includes("오후 2:00"));
check("buildPlanPrompt orderRationale 안내", p.includes("orderRationale"));
check("buildAssistPrompt type 반영", buildAssistPrompt("회의 준비", "agenda").includes("회의 안건"));

// 파서 + normalizePlan (정렬/랭크/rationale)
const raw = "```json\n" + JSON.stringify({
  headline: "핵심부터", orderRationale: "마감 기준으로 정렬",
  decisions: [
    { item: "잡일", verdict: "drop", why: "가치 낮음" },
    { item: "보고서", verdict: "DO_NOW", why: "마감", when: "오전" },
    { item: "잘못된", verdict: "WAT", why: "x" },
  ],
  timeline: [{ time: "14:00–15:00", block: "보고서", focus: "집중" }],
  firstArtifact: { forItem: "보고서", type: "outline", title: "보고서 개요", content: "- 요지" },
  amplify: { decisionsMade: 3, artifactsDrafted: 1, minutesSaved: 30 },
}) + "\n```";
const plan = normalizePlan(parseJson(raw));
check("normalizePlan 파싱", !!plan && plan.decisions.length === 3);
check("normalizePlan 정렬: DO_NOW가 1위", plan.decisions[0].item === "보고서");
check("normalizePlan rank 부여", plan.decisions[0].rank === 1 && plan.decisions[2].rank === 3);
check("normalizePlan 잘못된 verdict 보정", plan.decisions.some((d) => d.verdict === "SCHEDULE"));
check("normalizePlan orderRationale 유지", plan.orderRationale === "마감 기준으로 정렬");
check("normalizePlan firstArtifact", !!plan.firstArtifact && plan.firstArtifact.type === "outline");
check("parseJson 잘못된 입력 null", parseJson("not json") === null);

// normalizeArtifact
const art = normalizeArtifact({ type: "email", title: "안내", content: "본문" });
check("normalizeArtifact", !!art && art.type === "email" && art.typeKo === "이메일 초안");
check("normalizeArtifact 빈 content null", normalizeArtifact({ type: "email", content: "" }) === null);

// fallbackPlan (현재시각 기준 + 입력순서 비의존)
const fb = fallbackPlan(sample, NOW);
check("fallbackPlan headline 존재", typeof fb.headline === "string" && fb.headline.length > 0);
check("fallbackPlan orderRationale 현재시각 포함", fb.orderRationale.includes("14:00"));
check("fallbackPlan decisions 존재", fb.decisions.length >= 5);
check("fallbackPlan verdict 유효", fb.decisions.every((d) => VERDICTS.includes(d.verdict)));
check("fallbackPlan rank 1위", fb.decisions[0].rank === 1);
check("fallbackPlan 결정 덜어냄", fb.decisions.some((d) => ["DROP", "DEFER", "DELEGATE"].includes(d.verdict)));
check("fallbackPlan '언젠가'는 DROP", fb.decisions.find((d) => d.item.includes("사이드")).verdict === "DROP");
check("fallbackPlan '회신'은 DO_NOW 승격", fb.decisions.find((d) => d.item.includes("회신")).verdict === "DO_NOW");
check("fallbackPlan timeline 현재시각 이후", fb.timeline[0].time.startsWith("14:00"));
check("fallbackPlan 고정 09:00 슬롯 없음", !fb.timeline.some((b) => String(b.time).includes("09:00")));
check("fallbackPlan firstArtifact 존재", !!fb.firstArtifact && fb.firstArtifact.content.length > 0);
check("fallbackPlan amplify 일관", fb.amplify.decisionsMade === fb.decisions.length);

// fallbackArtifact 타입 추론
check("fallbackArtifact 회의->agenda", fallbackArtifact("팀 회의 준비").type === "agenda");
check("fallbackArtifact 메일->email", fallbackArtifact("고객에게 메일 답장").type === "email");

if (failures > 0) { console.error(`\nSMOKE FAIL: ${failures} check(s) failed.`); process.exit(1); }
console.log("\nSMOKE PASS: all checks passed.");
