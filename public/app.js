const $ = (id) => document.getElementById(id);

const els = {
  ctx: $("context"),
  run: $("run"),
  sample: $("sample"),
  clear: $("clear"),
  retry: $("retry"),
  hint: $("hint"),
  badge: $("source-badge"),
  empty: $("empty-state"),
  loading: $("loading-state"),
  error: $("error-state"),
  errorDetail: $("error-detail"),
  result: $("result"),
  headline: $("headline"),
  amplify: $("amplify"),
  decisions: $("decisions"),
  timeline: $("timeline"),
  artifactBlock: $("artifact-block"),
  artifactType: $("artifact-type"),
  artifactTitle: $("artifact-title"),
  artifactContent: $("artifact-content"),
  artifactNote: $("artifact-note"),
  artifactCopy: $("artifact-copy"),
  health: $("health"),
};

const STORAGE_KEY = "haru-autopilot:last";

const SAMPLE = [
  "분기 보고서 초안 쓰기",
  "팀 회의 자료 준비",
  "고객사에 회신 메일 보내기",
  "저녁에 운동 30분",
  "부모님께 전화",
  "세금 서류 확인",
  "언젠가 사이드 프로젝트 구경",
].join("\n");

function setState(name) {
  els.empty.hidden = name !== "empty";
  els.loading.hidden = name !== "loading";
  els.error.hidden = name !== "error";
  els.result.hidden = name !== "result";
}

function setBadge(source) {
  if (!source) { els.badge.hidden = true; return; }
  els.badge.hidden = false;
  if (source === "copilot-sdk") {
    els.badge.textContent = "Copilot SDK 에이전트";
    els.badge.className = "badge badge--sdk";
  } else {
    els.badge.textContent = "오프라인 결정 엔진";
    els.badge.className = "badge badge--fallback";
  }
}

function chipClass(verdict) {
  return "chip chip--" + String(verdict || "").toLowerCase();
}

function renderArtifact(artifact, note) {
  if (!artifact) { els.artifactBlock.hidden = true; return; }
  els.artifactBlock.hidden = false;
  els.artifactType.textContent = artifact.typeKo || artifact.type || "작업물";
  els.artifactTitle.textContent = artifact.title || "";
  els.artifactContent.textContent = artifact.content || "";
  els.artifactNote.textContent = note || "";
}

function render(data) {
  const plan = data.plan || {};
  els.headline.textContent = plan.headline || "";

  const amp = plan.amplify || {};
  els.amplify.innerHTML = "";
  [
    [amp.decisionsMade ?? 0, "결정 대행"],
    [amp.artifactsDrafted ?? 0, "초안 생성"],
    ["약 " + (amp.minutesSaved ?? 0) + "분", "절약 추정"],
  ].forEach(([num, label]) => {
    const chip = document.createElement("div");
    chip.className = "amplify__chip";
    const n = document.createElement("div");
    n.className = "amplify__num";
    n.textContent = num;
    const l = document.createElement("div");
    l.className = "amplify__label";
    l.textContent = label;
    chip.append(n, l);
    els.amplify.appendChild(chip);
  });

  els.decisions.innerHTML = "";
  (plan.decisions || []).forEach((d) => {
    const li = document.createElement("li");
    li.className = "decision" + (d.verdict === "DROP" ? " decision--drop" : "");

    const chip = document.createElement("span");
    chip.className = chipClass(d.verdict);
    chip.textContent = d.verdictKo || d.verdict;

    const body = document.createElement("div");
    body.className = "decision__body";
    const item = document.createElement("div");
    item.className = "decision__item";
    item.textContent = d.item;
    const why = document.createElement("div");
    why.className = "decision__why";
    why.textContent = d.why || "";
    body.append(item, why);
    if (d.when) {
      const when = document.createElement("span");
      when.className = "decision__when";
      when.textContent = "⏱ " + d.when;
      body.appendChild(when);
    }

    li.append(chip, body);

    if (d.verdict === "DO_NOW" || d.verdict === "SCHEDULE") {
      const btn = document.createElement("button");
      btn.className = "btn btn--mini decision__assist";
      btn.type = "button";
      btn.textContent = "시작 도와줘";
      btn.addEventListener("click", () => assist(d.item, btn));
      li.appendChild(btn);
    }
    els.decisions.appendChild(li);
  });

  els.timeline.innerHTML = "";
  (plan.timeline || []).forEach((b) => {
    const li = document.createElement("li");
    li.className = "tl";
    const time = document.createElement("div");
    time.className = "tl__time";
    time.textContent = b.time || "";
    const right = document.createElement("div");
    const block = document.createElement("div");
    block.className = "tl__block";
    block.textContent = b.block || "";
    const focus = document.createElement("div");
    focus.className = "tl__focus";
    focus.textContent = b.focus || "";
    right.append(block, focus);
    li.append(time, right);
    els.timeline.appendChild(li);
  });

  const fa = plan.firstArtifact;
  renderArtifact(fa, fa ? "에이전트가 1순위 작업을 위해 미리 만든 초안입니다." : "");

  setBadge(data.source);
  els.hint.textContent = data.notice || "";
  setState("result");
}

async function runPlan() {
  const context = els.ctx.value.trim();
  if (!context) {
    els.hint.textContent = "먼저 오늘의 맥락을 적어주세요.";
    els.ctx.focus();
    return;
  }
  els.run.disabled = true;
  els.hint.textContent = "";
  setBadge(null);
  setState("loading");
  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "요청을 처리하지 못했습니다.");
    render(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ context, data })); } catch (_) {}
  } catch (err) {
    els.errorDetail.textContent = String(err && err.message ? err.message : err);
    setState("error");
  } finally {
    els.run.disabled = false;
  }
}

async function assist(task, btn) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "생성 중…";
  try {
    const res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "작업물 생성 실패");
    const note =
      (data.source === "copilot-sdk"
        ? "Copilot SDK 에이전트가 생성한 초안"
        : "오프라인 템플릿으로 생성") + " · " + task;
    renderArtifact(data.artifact, note);
    els.artifactBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    els.artifactNote.textContent = "생성 실패: " + (err.message || err);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function restore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const { context, data } = JSON.parse(saved);
    if (context) els.ctx.value = context;
    if (data && data.plan) render(data);
  } catch (_) {}
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    const mode = data.authMode === "token" ? " · 토큰인증" : "";
    els.health.textContent = (data.ok ? "서버 정상" : "서버 점검 필요") + mode;
    els.health.className = "footer__health " + (data.ok ? "ok" : "down");
  } catch (_) {
    els.health.textContent = "서버 연결 안 됨";
    els.health.className = "footer__health down";
  }
}

async function copyArtifact() {
  try {
    await navigator.clipboard.writeText(els.artifactContent.textContent || "");
    els.artifactCopy.textContent = "복사됨";
    setTimeout(() => (els.artifactCopy.textContent = "복사"), 1500);
  } catch (_) {}
}

els.run.addEventListener("click", runPlan);
els.retry.addEventListener("click", runPlan);
els.artifactCopy.addEventListener("click", copyArtifact);
els.sample.addEventListener("click", () => {
  els.ctx.value = SAMPLE;
  els.hint.textContent = "예시를 채웠어요. 오토파일럿을 실행해 보세요.";
  els.ctx.focus();
});
els.clear.addEventListener("click", () => {
  els.ctx.value = "";
  els.hint.textContent = "";
  setBadge(null);
  setState("empty");
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  els.ctx.focus();
});

setState("empty");
restore();
checkHealth();
