// 네트워크 비의존 단위 smoke. lib.js 핵심 로직 검증.
import { buildPrompt, parseResult, fallbackResult } from "../lib.js";

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

const sample = "팀 회의 준비\n분기 보고서 작성\n저녁에 운동\n친구 약속 확인";

const prompt = buildPrompt(sample);
check("buildPrompt 입력 포함", prompt.includes("분기 보고서 작성"));
check("buildPrompt 스키마 포함", prompt.includes("top3"));

const raw =
  "```json\n{\"summary\":\"요약\",\"top3\":[{\"title\":\"보고서\",\"reason\":\"마감\"}],\"categories\":[{\"name\":\"업무\",\"items\":[\"회의\"]}],\"tomorrow\":[\"후속\"]}\n```";
const parsed = parseResult(raw);
check("parseResult 코드펜스 처리", !!parsed && parsed.top3.length === 1);
check("parseResult top3 title", !!parsed && parsed.top3[0].title === "보고서");
check("parseResult 잘못된 입력은 null", parseResult("이건 JSON이 아님") === null);

const fb = fallbackResult(sample);
check("fallback top3 3개", fb.top3.length === 3);
check("fallback 업무 분류", fb.categories.some((c) => c.name === "업무" && c.items.length > 0));
check("fallback summary 존재", typeof fb.summary === "string" && fb.summary.length > 0);

if (failures > 0) {
  console.error(`\nSMOKE FAIL: ${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nSMOKE PASS: all checks passed.");
