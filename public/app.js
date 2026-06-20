const $ = (id) => document.getElementById(id);

const els = {
  ctx: $("context"), run: $("run"), sample: $("sample"), clear: $("clear"), retry: $("retry"),
  hint: $("hint"), badge: $("source-badge"), health: $("health"),
  empty: $("empty-state"), loading: $("loading-state"), error: $("error-state"), errorDetail: $("error-detail"),
  result: $("result"), amplify: $("amplify"), rationale: $("rationale"),
  hero: $("hero"), heroChip: $("hero-chip"), heroItem: $("hero-item"), heroWhy: $("hero-why"),
  heroArtifact: $("hero-artifact"), heroAType: $("hero-artifact-type"), heroATitle: $("hero-artifact-title"),
  heroAContent: $("hero-artifact-content"), heroACopy: $("hero-artifact-copy"),
  heroMake: $("hero-make"), heroToggle: $("hero-toggle"),
  decisions: $("decisions"), timeline: $("timeline"),
  cancel: $("cancel"), steps: $("progress-steps"),
};

let planAbort = null;
let stepTimer = null;
function startProgress() {
  const items = els.steps ? els.steps.querySelectorAll("li") : [];
  let i = 0;
  items.forEach((el) => el.classList.remove("on", "done"));
  if (items[0]) items[0].classList.add("on");
  clearInterval(stepTimer);
  stepTimer = setInterval(() => {
    if (i < items.length - 1) {
      items[i].classList.remove("on");
      items[i].classList.add("done");
      i += 1;
      items[i].classList.add("on");
    }
  }, 3500);
}
function stopProgress() {
  clearInterval(stepTimer);
  stepTimer = null;
}

const STORAGE_KEY = "oh-my-dayauto:last";
const SAMPLE = [
  "분기 보고서 초안 쓰기", "팀 회의 자료 준비", "고객사에 회신 메일 보내기",
  "저녁에 운동 30분", "부모님께 전화", "세금 서류 확인", "언젠가 사이드 프로젝트 구경",
].join("\n");

// 화면 상태: plan + 사용자가 조정한 표시 순서(order) + 히어로 작업물
const state = { plan: null, order: [], heroArtifact: null, artifactOpen: true };

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

function chipClass(v) { return "chip chip--" + String(v || "").toLowerCase(); }

function renderAmplify(amp) {
  els.amplify.innerHTML = "";
  [
    [amp.decisionsMade ?? 0, "결정 대행"],
    [amp.artifactsDrafted ?? 0, "초안 생성"],
    ["약 " + (amp.minutesSaved ?? 0) + "분", "절약 추정"],
  ].forEach(([n, label]) => {
    const c = document.createElement("div"); c.className = "amplify__chip";
    const nn = document.createElement("div"); nn.className = "amplify__num"; nn.textContent = n;
    const l = document.createElement("div"); l.className = "amplify__label"; l.textContent = label;
    c.append(nn, l); els.amplify.appendChild(c);
  });
}

function showHeroArtifact(artifact) {
  if (!artifact) { els.heroArtifact.hidden = true; els.heroToggle.hidden = true; return; }
  els.heroAType.textContent = artifact.typeKo || artifact.type || "작업물";
  els.heroATitle.textContent = artifact.title || "";
  els.heroAContent.textContent = artifact.content || "";
  els.heroArtifact.hidden = !state.artifactOpen;
  els.heroToggle.hidden = false;
  els.heroToggle.textContent = state.artifactOpen ? "초안 접기" : "초안 보기";
}

function renderHero() {
  const top = state.plan.decisions[state.order[0]];
  if (!top) return;
  els.heroChip.className = chipClass(top.verdict);
  els.heroChip.textContent = top.verdictKo || top.verdict;
  els.heroItem.textContent = top.item;
  els.heroWhy.textContent = top.why || "";

  // 히어로 작업물: 원본 firstArtifact가 이 항목이면 표시, 아니면 '초안 만들기'
  const fa = state.plan.firstArtifact;
  const matched = state.heroArtifact
    ? state.heroArtifact
    : (fa && fa.forItem && fa.forItem === top.item ? fa : null);
  if (matched) {
    state.heroArtifact = matched;
    showHeroArtifact(matched);
    els.heroMake.hidden = true;
  } else {
    els.heroArtifact.hidden = true;
    els.heroToggle.hidden = true;
    els.heroMake.hidden = false;
    els.heroMake.textContent = "이 작업 초안 만들기";
    els.heroMake.disabled = false;
  }
}

function renderDecisions() {
  els.decisions.innerHTML = "";
  state.order.slice(1).forEach((idx) => {
    const d = state.plan.decisions[idx];
    const li = document.createElement("li");
    li.className = "decision" + (d.verdict === "DROP" ? " decision--drop" : "");

    const rank = document.createElement("div");
    rank.className = "decision__rank"; rank.textContent = state.order.indexOf(idx) + 1;

    const chip = document.createElement("span");
    chip.className = chipClass(d.verdict); chip.textContent = d.verdictKo || d.verdict;

    const body = document.createElement("div"); body.className = "decision__body";
    const item = document.createElement("div"); item.className = "decision__item";
    item.textContent = d.item;
    if (d.when) { const w = document.createElement("span"); w.className = "decision__when"; w.textContent = "⏱ " + d.when; item.appendChild(w); }
    const why = document.createElement("div"); why.className = "decision__why"; why.textContent = d.why || "";
    body.append(item, why);
    body.style.cursor = "pointer";
    body.addEventListener("click", () => li.classList.toggle("open"));

    const ctrl = document.createElement("div"); ctrl.className = "decision__ctrl";
    const up = document.createElement("button");
    up.className = "iconbtn"; up.type = "button"; up.title = "위로"; up.setAttribute("aria-label", d.item + " 우선순위 위로"); up.textContent = "↑";
    up.addEventListener("click", () => moveUp(idx));
    const now = document.createElement("button");
    now.className = "iconbtn iconbtn--now"; now.type = "button"; now.title = "맨 위로"; now.setAttribute("aria-label", d.item + " 지금 할 일로 올리기"); now.textContent = "지금으로";
    now.addEventListener("click", () => promote(idx));
    ctrl.append(up, now);

    li.append(rank, chip, body, ctrl);
    els.decisions.appendChild(li);
  });
}

function renderTimeline() {
  els.timeline.innerHTML = "";
  (state.plan.timeline || []).forEach((b) => {
    const li = document.createElement("li"); li.className = "tl";
    const t = document.createElement("div"); t.className = "tl__time"; t.textContent = b.time || "";
    const r = document.createElement("div");
    const bl = document.createElement("div"); bl.className = "tl__block"; bl.textContent = b.block || "";
    const f = document.createElement("div"); f.className = "tl__focus"; f.textContent = b.focus || "";
    r.append(bl, f); li.append(t, r); els.timeline.appendChild(li);
  });
}

function renderAll() {
  renderAmplify(state.plan.amplify || {});
  els.rationale.textContent = state.plan.orderRationale || "마감·영향·시간 민감도를 기준으로 정렬했어요.";
  renderHero();
  renderDecisions();
  renderTimeline();
  setState("result");
}

function moveUp(idx) {
  const pos = state.order.indexOf(idx);
  if (pos <= 0) return;
  [state.order[pos - 1], state.order[pos]] = [state.order[pos], state.order[pos - 1]];
  if (pos - 1 === 0) state.heroArtifact = null; // 히어로 교체 → 작업물 재생성 유도
  state.artifactOpen = true;
  renderAll();
}
function promote(idx) {
  state.order = [idx, ...state.order.filter((i) => i !== idx)];
  state.heroArtifact = null;
  state.artifactOpen = true;
  renderAll();
  els.hero.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function applyPlan(data) {
  state.plan = data.plan;
  state.order = data.plan.decisions.map((_, i) => i);
  state.heroArtifact = null;
  state.artifactOpen = true;
  setBadge(data.source);
  els.hint.textContent = data.notice || "";
  renderAll();
}

async function runPlan() {
  const context = els.ctx.value.trim();
  if (!context) { els.hint.textContent = "먼저 오늘의 맥락을 적어주세요."; els.ctx.focus(); return; }
  els.run.disabled = true; els.hint.textContent = ""; setBadge(null); setState("loading");
  startProgress();
  planAbort = new AbortController();
  try {
    const res = await fetch("/api/plan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
      signal: planAbort.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "요청을 처리하지 못했습니다.");
    applyPlan(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ context, data })); } catch (_) {}
  } catch (err) {
    if (err && err.name === "AbortError") {
      setState("empty");
      els.hint.textContent = "요청을 취소했어요.";
    } else {
      els.errorDetail.textContent = String(err && err.message ? err.message : err);
      setState("error");
    }
  } finally { els.run.disabled = false; planAbort = null; stopProgress(); }
}

function cancelPlan() {
  if (planAbort) planAbort.abort();
}

async function makeHeroArtifact() {
  const top = state.plan.decisions[state.order[0]];
  if (!top) return;
  els.heroMake.disabled = true; els.heroMake.textContent = "생성 중…";
  try {
    const res = await fetch("/api/assist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: top.item }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "작업물 생성 실패");
    state.heroArtifact = data.artifact;
    state.artifactOpen = true;
    renderHero();
  } catch (err) {
    els.heroMake.disabled = false; els.heroMake.textContent = "다시 시도";
    els.hint.textContent = "초안 생성 실패: " + (err.message || err);
  }
}

function restore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const { context, data } = JSON.parse(saved);
    if (context) els.ctx.value = context;
    if (data && data.plan) applyPlan(data);
  } catch (_) {}
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health"); const data = await res.json();
    const mode = data.authMode === "token" ? " · 토큰인증" : "";
    els.health.textContent = (data.ok ? "서버 정상" : "서버 점검 필요") + mode;
    els.health.className = "health " + (data.ok ? "ok" : "down");
  } catch (_) { els.health.textContent = "서버 연결 안 됨"; els.health.className = "health down"; }
}

async function copyHero() {
  try { await navigator.clipboard.writeText(els.heroAContent.textContent || "");
    els.heroACopy.textContent = "복사됨"; setTimeout(() => (els.heroACopy.textContent = "복사"), 1500);
  } catch (_) {}
}

els.run.addEventListener("click", runPlan);
els.cancel.addEventListener("click", cancelPlan);
els.retry.addEventListener("click", runPlan);
els.heroMake.addEventListener("click", makeHeroArtifact);
els.heroACopy.addEventListener("click", copyHero);
els.heroToggle.addEventListener("click", () => { state.artifactOpen = !state.artifactOpen; showHeroArtifact(state.heroArtifact); });
els.sample.addEventListener("click", () => { els.ctx.value = SAMPLE; els.hint.textContent = "예시를 채웠어요. 오토파일럿을 실행해 보세요."; els.ctx.focus(); });
els.clear.addEventListener("click", () => {
  els.ctx.value = ""; els.hint.textContent = ""; setBadge(null); setState("empty");
  state.plan = null; state.order = [];
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  els.ctx.focus();
});

setState("empty");
restore();
checkHealth();
