// 하루 오토파일럿 — 핵심 로직 (네트워크 비의존). server.js + smoke 재사용.
// 단순 정리가 아니라 '결정 대행 + 근거 + 타임라인 + 첫 작업물'을 다룬다.
// 투명성 원칙: 입력 순서가 아니라 마감/영향/시간민감도로 재정렬하고, 그 이유를 명시한다.

export const VERDICTS = ["DO_NOW", "SCHEDULE", "DEFER", "DELEGATE", "DROP"];
export const ARTIFACT_TYPES = ["email", "agenda", "checklist", "outline", "message"];

const VERDICT_KO = {
  DO_NOW: "지금 바로",
  SCHEDULE: "오늘 안에",
  DEFER: "미루기",
  DELEGATE: "위임",
  DROP: "버리기",
};
const TYPE_KO = {
  email: "이메일 초안",
  agenda: "회의 안건",
  checklist: "체크리스트",
  outline: "문서 개요",
  message: "메시지 초안",
};
// 화면 정렬용 우선순위 (작을수록 위/먼저)
const VERDICT_RANK = { DO_NOW: 0, SCHEDULE: 1, DELEGATE: 2, DEFER: 3, DROP: 4 };

export const PLAN_SCHEMA = `{
  "headline": string,                  // 오늘의 한 줄 전략
  "orderRationale": string,            // '입력 순서가 아니라 무엇을 기준으로 정했는지' 1~2문장
  "decisions": [
    { "item": string, "verdict": "DO_NOW|SCHEDULE|DEFER|DELEGATE|DROP",
      "why": string, "when": string }
  ],
  "timeline": [ { "time": string, "block": string, "focus": string } ],
  "firstArtifact": {
    "forItem": string, "type": "email|agenda|checklist|outline|message",
    "title": string, "content": string
  },
  "amplify": { "decisionsMade": number, "artifactsDrafted": number, "minutesSaved": number }
}`;

function pad2(n) {
  return String(n).padStart(2, "0");
}
function fmtTime(d) {
  return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}
function addMinutes(d, m) {
  return new Date(d.getTime() + m * 60000);
}
function koClock(d) {
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${pad2(d.getMinutes())}`;
}

export function buildPlanPrompt(context, now = new Date()) {
  const nowStr = koClock(now);
  return [
    "당신은 사용자의 '하루 오토파일럿' 에이전트입니다.",
    "단순 요약/정리가 아니라, 사용자를 대신해 '결정'을 단호히 내리는 것이 목표입니다.",
    `지금 시각은 ${nowStr} 입니다. 모든 시간 배치는 지금 시각 이후의 현실적인 시간으로 만드세요.`,
    "",
    "가장 중요한 원칙(반드시 지킬 것):",
    "- 입력된 순서를 그대로 따르지 마세요. 마감 임박, 영향 범위, 시간 민감도, 타인 의존도를 기준으로 우선순위를 다시 정하세요.",
    "- 결정 비용을 줄이는 것이 핵심이므로, 모두 DO_NOW로 두지 말고 과감히 DEFER/DROP/DELEGATE 하세요. 적어도 하나는 덜어내세요.",
    "- orderRationale에는 '입력 순서가 아니라 무엇을 기준으로 이 순서를 정했는지'를 사용자에게 1~2문장으로 설명하세요.",
    "",
    "필드 규칙:",
    "- decisions: 영향/마감이 큰 것부터 정렬. 각 항목에 verdict(DO_NOW/SCHEDULE/DEFER/DELEGATE/DROP)를 하나씩, why는 한 문장. DO_NOW/SCHEDULE이면 when에 시간대.",
    "- timeline: 지금 시각 이후로 3~5개의 현실적 시간블록. time은 'HH:MM–HH:MM' 형식. block은 무엇을, focus는 왜.",
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

// 결정을 verdict 우선순위로 안정 정렬하고 rank를 부여한다.
function sortAndRank(decisions) {
  return decisions
    .map((d, i) => ({ d, i }))
    .sort((a, b) => {
      const ra = VERDICT_RANK[a.d.verdict] ?? 9;
      const rb = VERDICT_RANK[b.d.verdict] ?? 9;
      return ra - rb || a.i - b.i;
    })
    .map(({ d }, idx) => ({ ...d, rank: idx + 1 }));
}

export function normalizePlan(obj) {
  if (!obj || typeof obj !== "object") return null;
  let decisions = asArray(obj.decisions)
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
  decisions = sortAndRank(decisions);

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
    orderRationale:
      str(obj.orderRationale) ||
      "입력하신 순서가 아니라, 마감·영향·시간 민감도를 기준으로 다시 정렬했어요.",
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

const URGENT_HINTS = ["마감", "오늘", "긴급", "지금", "당장", "데드라인", "제출", "회신", "답장", "마감일"];
const DROP_HINTS = ["언젠가", "나중에", "아이디어", "혹시", "여유되면", "구경", "둘러보기", "심심"];
const DELEGATE_HINTS = ["부탁", "요청", "위임", "대신", "맡기", "공유받", "전달받"];
const MEETING_HINTS = ["회의", "미팅", "면담", "스탠드업", "킥오프", "발표", "보고"];
const EMAIL_HINTS = ["메일", "이메일", "답장", "회신", "메시지", "연락", "전화"];

// 입력 순서가 아니라 키워드 신호 + 위치를 함께 보고 verdict를 추론한다.
function inferVerdict(line, idx) {
  if (DELEGATE_HINTS.some((h) => line.includes(h))) return "DELEGATE";
  if (DROP_HINTS.some((h) => line.includes(h))) return "DROP";
  if (URGENT_HINTS.some((h) => line.includes(h))) return "DO_NOW";
  if (MEETING_HINTS.some((h) => line.includes(h))) return "SCHEDULE";
  if (idx === 0) return "DO_NOW";
  if (idx <= 2) return "SCHEDULE";
  if (idx >= 6) return "DEFER";
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

export function fallbackPlan(context, now = new Date()) {
  const lines = splitLines(context);
  if (!lines.length) {
    return {
      headline: "오늘 처리할 맥락을 적으면 에이전트가 결정을 대신 내립니다.",
      orderRationale: "",
      decisions: [],
      timeline: [],
      firstArtifact: null,
      amplify: { decisionsMade: 0, artifactsDrafted: 0, minutesSaved: 0 },
    };
  }
  let decisions = lines.slice(0, 10).map((line, i) => {
    const verdict = inferVerdict(line, i);
    const whyMap = {
      DO_NOW: "마감·영향이 가장 커서 먼저 진전을 내야 합니다.",
      SCHEDULE: "오늘 안에 끝내면 좋은 항목이라 시간블록에 배치했습니다.",
      DEFER: "지금 안 해도 손실이 적어 뒤로 미뤘습니다.",
      DROP: "가치 대비 비용이 낮아 과감히 버리는 것이 낫습니다.",
      DELEGATE: "다른 사람이 더 잘/빠르게 할 수 있어 위임을 권합니다.",
    };
    return { item: line, verdict, verdictKo: VERDICT_KO[verdict], why: whyMap[verdict], when: "" };
  });
  // 입력 순서가 아니라 verdict 우선순위로 재정렬 + rank 부여
  decisions = sortAndRank(decisions);

  // 지금 시각 이후로 현실적 시간블록 구성 (고정 09:00 슬롯 제거)
  const doItems = decisions.filter((d) => d.verdict === "DO_NOW" || d.verdict === "SCHEDULE");
  const durations = [60, 45, 60, 30];
  let cursor = new Date(now);
  const timeline = [];
  doItems.slice(0, 4).forEach((d, i) => {
    const end = addMinutes(cursor, durations[i] || 45);
    timeline.push({ time: fmtTime(cursor) + "–" + fmtTime(end), block: d.item, focus: d.why });
    if (d.verdict === "DO_NOW" || d.verdict === "SCHEDULE") d.when = fmtTime(cursor);
    cursor = addMinutes(end, 10);
  });
  timeline.push({ time: fmtTime(cursor) + " 이후", block: "마무리·내일 준비", focus: "오늘 완료 점검 + 남은 항목 이월" });

  const top = decisions[0];
  const firstArtifact = top ? fallbackArtifact(top.item, inferType(top.item)) : null;
  if (firstArtifact) firstArtifact.forItem = top.item;

  const dropped = decisions.filter((d) => ["DROP", "DELEGATE", "DEFER"].includes(d.verdict)).length;
  return {
    headline: `지금은 '${top ? top.item : "핵심 업무"}'부터. ${dropped}건은 덜어내 집중도를 높였어요.`,
    orderRationale: `입력하신 순서가 아니라, 마감·영향·시간 민감도를 기준으로 다시 정렬했어요. 지금 시각(${fmtTime(now)}) 이후로 배치했습니다.`,
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
