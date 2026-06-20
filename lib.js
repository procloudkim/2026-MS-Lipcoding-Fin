// 하루 오토파일럿 — 핵심 로직 (네트워크 비의존). server.js + smoke 재사용.
// 단순 정리가 아니라 '결정 대행 + 타임라인 + 첫 작업물'을 다룬다.

export const VERDICTS = ["DO_NOW", "SCHEDULE", "DEFER", "DROP", "DELEGATE"];
export const ARTIFACT_TYPES = ["email", "agenda", "checklist", "outline", "message"];

const VERDICT_KO = {
  DO_NOW: "지금 바로",
  SCHEDULE: "오늘 안에",
  DEFER: "미루기",
  DROP: "버리기",
  DELEGATE: "위임",
};
const TYPE_KO = {
  email: "이메일 초안",
  agenda: "회의 안건",
  checklist: "체크리스트",
  outline: "문서 개요",
  message: "메시지 초안",
};

export const PLAN_SCHEMA = `{
  "headline": string,                 // 오늘의 한 줄 전략
  "decisions": [                       // 항목별로 '대신 내린 결정'
    { "item": string, "verdict": "DO_NOW|SCHEDULE|DEFER|DROP|DELEGATE",
      "why": string, "when": string }
  ],
  "timeline": [ { "time": string, "block": string, "focus": string } ],
  "firstArtifact": {                   // 1순위 DO_NOW를 바로 시작할 작업물
    "forItem": string, "type": "email|agenda|checklist|outline|message",
    "title": string, "content": string
  },
  "amplify": { "decisionsMade": number, "artifactsDrafted": number, "minutesSaved": number }
}`;

export function buildPlanPrompt(context) {
  return [
    "당신은 사용자의 '하루 오토파일럿' 에이전트입니다.",
    "단순 요약/정리가 아니라, 사용자를 대신해 '결정'을 단호히 내리는 것이 목표입니다.",
    "결정 비용을 줄이는 것이 핵심이므로, 모두 DO_NOW로 두지 말고 과감히 DEFER/DROP/DELEGATE 하세요.",
    "",
    "규칙:",
    "- decisions: 각 항목에 verdict(DO_NOW/SCHEDULE/DEFER/DROP/DELEGATE)를 하나씩 단호히 부여. why는 한 문장. DO_NOW/SCHEDULE이면 when에 시간대(예 '09:00-10:30' 또는 '오전').",
    "- 적어도 하나는 DROP 또는 DELEGATE 또는 DEFER로 처리해 결정 부담을 덜어줄 것.",
    "- timeline: 현실적인 3~6개 시간블록으로 오늘을 배치. block은 무엇을, focus는 왜/핵심.",
    "- firstArtifact: 가장 중요한 DO_NOW 1건을 '지금 바로' 시작할 수 있는 한국어 작업물 초안. type을 적절히 고르고 content는 바로 사용 가능한 본문.",
    "- amplify: decisionsMade(내가 내린 결정 수), artifactsDrafted(보통 1), minutesSaved(추정 절약 분).",
    "- 모든 텍스트는 한국어.",
    "",
    "아래 JSON 스키마만 출력하세요. 코드펜스/설명/인사말 없이 JSON만.",
    PLAN_SCHEMA,
    "",
    "사용자의 오늘 맥락:",
    context,
  ].join("\n");
}

export function buildAssistPrompt(task, type) {
  const t = ARTIFACT_TYPES.includes(type) ? type : "checklist";
  return [
    "당신은 실행 보조 에이전트입니다.",
    `다음 작업을 '지금 바로' 시작할 수 있도록 완성도 높은 ${TYPE_KO[t]}을(를) 만드세요.`,
    "군더더기 없이, 바로 사용 가능한 한국어로 작성합니다.",
    "아래 JSON만 출력(코드펜스/설명 금지):",
    `{ "type": "${t}", "title": string, "content": string }`,
    "",
    "작업:",
    task,
  ].join("\n");
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function str(v) {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}
function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

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

export function normalizePlan(obj) {
  if (!obj || typeof obj !== "object") return null;
  const decisions = asArray(obj.decisions)
    .map((d) => {
      let verdict = str(d?.verdict).toUpperCase().replace(/[^A-Z_]/g, "");
      if (!VERDICTS.includes(verdict)) verdict = "SCHEDULE";
      return {
        item: str(d?.item),
        verdict,
        verdictKo: VERDICT_KO[verdict],
        why: str(d?.why),
        when: str(d?.when),
      };
    })
    .filter((d) => d.item)
    .slice(0, 10);

  const timeline = asArray(obj.timeline)
    .map((b) => ({ time: str(b?.time), block: str(b?.block), focus: str(b?.focus) }))
    .filter((b) => b.block)
    .slice(0, 6);

  let firstArtifact = null;
  const fa = obj.firstArtifact;
  if (fa && typeof fa === "object" && str(fa.content)) {
    let type = str(fa.type).toLowerCase();
    if (!ARTIFACT_TYPES.includes(type)) type = "checklist";
    firstArtifact = {
      forItem: str(fa.forItem),
      type,
      typeKo: TYPE_KO[type],
      title: str(fa.title) || "바로 시작하기",
      content: str(fa.content),
    };
  }

  const amp = obj.amplify || {};
  const amplify = {
    decisionsMade: num(amp.decisionsMade, decisions.length),
    artifactsDrafted: num(amp.artifactsDrafted, firstArtifact ? 1 : 0),
    minutesSaved: num(amp.minutesSaved, decisions.length * 4 + (firstArtifact ? 12 : 0)),
  };

  const headline = str(obj.headline);
  if (!headline && !decisions.length) return null;
  return {
    headline: headline || "오늘의 핵심에 먼저 손을 대세요.",
    decisions,
    timeline,
    firstArtifact,
    amplify,
  };
}

export function normalizeArtifact(obj) {
  if (!obj || typeof obj !== "object") return null;
  const content = str(obj.content);
  if (!content) return null;
  let type = str(obj.type).toLowerCase();
  if (!ARTIFACT_TYPES.includes(type)) type = "checklist";
  return {
    type,
    typeKo: TYPE_KO[type],
    title: str(obj.title) || "작업물 초안",
    content,
  };
}

// ---------- 결정적 fallback (SDK 미연결 시에도 리치 결과) ----------

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n|[\u2022]|(?:^|\s)\d+[.)]\s/)
    .map((s) => s.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);
}

const DROP_HINTS = ["언젠가", "나중에", "아이디어", "혹시", "여유되면", "구경", "둘러보기"];
const DELEGATE_HINTS = ["부탁", "요청", "위임", "대신", "맡기", "공유받", "전달받"];
const MEETING_HINTS = ["회의", "미팅", "면담", "스탠드업", "킥오프"];
const EMAIL_HINTS = ["메일", "이메일", "답장", "회신", "메시지", "연락", "전화"];

function inferVerdict(line, idx) {
  if (DELEGATE_HINTS.some((h) => line.includes(h))) return "DELEGATE";
  if (DROP_HINTS.some((h) => line.includes(h))) return idx >= 4 ? "DROP" : "DEFER";
  if (idx === 0) return "DO_NOW";
  if (idx <= 2) return "SCHEDULE";
  if (idx >= 6) return "DROP";
  return "DEFER";
}

function inferType(line) {
  if (MEETING_HINTS.some((h) => line.includes(h))) return "agenda";
  if (EMAIL_HINTS.some((h) => line.includes(h))) return "email";
  return "checklist";
}

export function fallbackArtifact(task, type) {
  const t = ARTIFACT_TYPES.includes(type) ? type : inferType(task || "");
  const title = (task || "작업").slice(0, 40);
  let content;
  if (t === "email") {
    content = [
      "제목: " + title,
      "",
      "안녕하세요,",
      "",
      "아래 건으로 연락드립니다: " + title + ".",
      "- 배경: (한 줄로 상황 정리)",
      "- 요청/제안: (상대가 할 일 1가지)",
      "- 기한: (날짜)",
      "",
      "확인 부탁드립니다. 감사합니다.",
    ].join("\n");
  } else if (t === "agenda") {
    content = [
      title + " — 회의 안건",
      "",
      "1. 목표(이 회의로 무엇을 결정?) — 5분",
      "2. 현황 공유 — 10분",
      "3. 핵심 논점/결정 사항 — 15분",
      "4. 액션아이템·담당·기한 정리 — 5분",
      "",
      "사전 준비: 관련 자료 링크, 결정 필요한 질문 1~2개",
    ].join("\n");
  } else if (t === "outline") {
    content = [
      title + " — 개요",
      "",
      "- 한 줄 요지:",
      "- 핵심 포인트 3가지:",
      "  1) ",
      "  2) ",
      "  3) ",
      "- 결론/다음 행동:",
    ].join("\n");
  } else if (t === "message") {
    content = title + " 관련 공유드립니다. 핵심만 정리하면 (1) 상황, (2) 필요한 결정, (3) 기한입니다. 의견 주세요!";
  } else {
    content = [
      title + " — 시작 체크리스트",
      "",
      "[ ] 가장 작은 첫 단계 1가지 정의",
      "[ ] 필요한 자료/사람 확보",
      "[ ] 25분 집중 타이머로 착수",
      "[ ] 끝나는 기준(완료 정의) 한 줄",
      "[ ] 다음 단계 메모",
    ].join("\n");
  }
  return { type: t, typeKo: TYPE_KO[t], title, content };
}

export function fallbackPlan(context) {
  const lines = splitLines(context);
  if (!lines.length) {
    return {
      headline: "오늘 처리할 맥락을 적으면 에이전트가 결정을 대신 내립니다.",
      decisions: [],
      timeline: [],
      firstArtifact: null,
      amplify: { decisionsMade: 0, artifactsDrafted: 0, minutesSaved: 0 },
    };
  }
  const decisions = lines.slice(0, 10).map((line, i) => {
    const verdict = inferVerdict(line, i);
    const when =
      verdict === "DO_NOW" ? "오전 집중" : verdict === "SCHEDULE" ? "오늘 중" : "";
    const whyMap = {
      DO_NOW: "영향과 마감이 가장 커서 먼저 진전을 내야 합니다.",
      SCHEDULE: "오늘 안에 끝내면 좋은 항목이라 시간블록에 배치했습니다.",
      DEFER: "지금 안 해도 손실이 적어 내일로 미뤘습니다.",
      DROP: "가치 대비 비용이 낮아 과감히 버리는 것이 낫습니다.",
      DELEGATE: "다른 사람이 더 잘/빠르게 할 수 있어 위임을 권합니다.",
    };
    return {
      item: line,
      verdict,
      verdictKo: VERDICT_KO[verdict],
      why: whyMap[verdict],
      when,
    };
  });

  const doItems = decisions.filter((d) => d.verdict === "DO_NOW" || d.verdict === "SCHEDULE");
  const timeline = [];
  const slots = ["09:00-10:30", "10:30-12:00", "13:30-15:00", "15:00-16:30", "16:30-17:30"];
  doItems.slice(0, 4).forEach((d, i) => {
    timeline.push({ time: slots[i] || "오후", block: d.item, focus: d.why });
  });
  timeline.push({ time: "17:30-18:00", block: "마무리·내일 준비", focus: "오늘 완료 점검 + 남은 항목 이월" });

  const top = decisions.find((d) => d.verdict === "DO_NOW") || decisions[0];
  const firstArtifact = top ? fallbackArtifact(top.item, inferType(top.item)) : null;
  if (firstArtifact) firstArtifact.forItem = top.item;

  const dropped = decisions.filter((d) => d.verdict === "DROP" || d.verdict === "DELEGATE" || d.verdict === "DEFER").length;
  return {
    headline:
      `오늘은 '${top ? top.item : "핵심 업무"}'에 먼저 손대고, ${dropped}건은 덜어내 집중도를 높이세요.`,
    decisions,
    timeline,
    firstArtifact,
    amplify: {
      decisionsMade: decisions.length,
      artifactsDrafted: firstArtifact ? 1 : 0,
      minutesSaved: decisions.length * 4 + (firstArtifact ? 12 : 0),
    },
  };
}
