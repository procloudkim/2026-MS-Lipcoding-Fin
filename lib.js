// 하루 정리 핵심 로직 (네트워크 비의존). server.js와 smoke 모두 재사용.

export const RESULT_SCHEMA = `{
  "summary": string,
  "top3": [{ "title": string, "reason": string }],
  "categories": [{ "name": string, "items": string[] }],
  "tomorrow": string[]
}`;

export function buildPrompt(text) {
  return [
    "다음은 사용자가 오늘 작성한 할 일과 메모입니다.",
    "이를 분석해 개인 생산성을 높이도록 정리하세요.",
    "반드시 아래 JSON 스키마만 출력하세요. 코드펜스, 설명, 인사말 없이 JSON만 출력합니다.",
    RESULT_SCHEMA,
    "규칙:",
    "- top3: 오늘 가장 중요한 항목 3개 이내, reason은 한 문장.",
    "- categories: 업무/개인/기타 등 의미 있는 묶음.",
    "- tomorrow: 내일 이어서 할 일 제안 3개 이내.",
    "- 모든 텍스트는 한국어.",
    "입력:",
    text,
  ].join("\n");
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

export function normalizeResult(obj) {
  if (!obj || typeof obj !== "object") return null;
  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    top3: asArray(obj.top3)
      .map((it) => ({
        title: String(it?.title ?? "").trim(),
        reason: String(it?.reason ?? "").trim(),
      }))
      .filter((it) => it.title)
      .slice(0, 3),
    categories: asArray(obj.categories)
      .map((c) => ({
        name: String(c?.name ?? "").trim(),
        items: asArray(c?.items).map((s) => String(s).trim()).filter(Boolean),
      }))
      .filter((c) => c.name && c.items.length),
    tomorrow: asArray(obj.tomorrow).map((s) => String(s).trim()).filter(Boolean).slice(0, 3),
  };
}

export function parseResult(raw) {
  if (!raw || typeof raw !== "string") return null;
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);
  try {
    return normalizeResult(JSON.parse(t));
  } catch {
    return null;
  }
}

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n|[•\-\u2022]|(?:^|\s)\d+[.)]\s/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const WORK_HINTS = ["회의", "보고", "메일", "이메일", "업무", "프로젝트", "리뷰", "발표", "고객", "배포", "코드", "기획"];
const PERSONAL_HINTS = ["운동", "약속", "장보기", "병원", "가족", "친구", "독서", "휴식", "집안", "식사"];

// SDK 미연결 시에도 유용한 결과를 주는 결정적 fallback.
export function fallbackResult(text) {
  const lines = splitLines(text);
  const top3 = lines.slice(0, 3).map((line, i) => ({
    title: line,
    reason: i === 0 ? "가장 먼저 처리하면 오늘 흐름이 풀립니다." : "오늘 안에 마무리하면 좋은 항목입니다.",
  }));
  const work = [];
  const personal = [];
  const etc = [];
  for (const line of lines) {
    if (WORK_HINTS.some((h) => line.includes(h))) work.push(line);
    else if (PERSONAL_HINTS.some((h) => line.includes(h))) personal.push(line);
    else etc.push(line);
  }
  const categories = [
    { name: "업무", items: work },
    { name: "개인", items: personal },
    { name: "기타", items: etc },
  ].filter((c) => c.items.length);
  const tomorrow = lines.slice(3, 6);
  return {
    summary: lines.length ? `오늘 ${lines.length}개의 항목을 정리했습니다.` : "정리할 항목이 없습니다.",
    top3,
    categories,
    tomorrow,
  };
}
