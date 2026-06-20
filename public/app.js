const $ = (id) => document.getElementById(id);

const els = {
  // guide
  catFilters: $("cat-filters"),
  guideLoading: $("guide-loading"),
  guideEmpty: $("guide-empty"),
  guideGrid: $("guide-grid"),
  // brief
  query: $("query"),
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
  verdictWrap: document.querySelector(".verdict"),
  verdictBadge: $("verdict-badge"),
  verdictProduct: $("verdict-product"),
  verdictReason: $("verdict-reason"),
  ageBlock: $("age-block"),
  agefit: $("agefit"),
  evidenceBlock: $("evidence-block"),
  evidence: $("evidence"),
  gapBlock: $("gap-block"),
  infogaps: $("infogaps"),
  checklistBlock: $("checklist-block"),
  checklist: $("checklist"),
  altBlock: $("alt-block"),
  alternatives: $("alternatives"),
  sourcesBlock: $("sources-block"),
  sources: $("sources"),
  disclaimer: $("disclaimer"),
  health: $("health"),
  // modal
  modal: $("topic-modal"),
  modalIcon: $("modal-icon"),
  modalCat: $("modal-cat"),
  modalTitle: $("modal-title"),
  modalVerdict: $("modal-verdict"),
  modalSummary: $("modal-summary"),
  modalChecklist: $("modal-checklist"),
  modalCheckSec: $("modal-check-sec"),
  modalGaps: $("modal-gaps"),
  modalGapSec: $("modal-gap-sec"),
  modalAlts: $("modal-alts"),
  modalAltSec: $("modal-alt-sec"),
  modalSources: $("modal-sources"),
  modalSrcSec: $("modal-src-sec"),
  modalClose: $("modal-close"),
  modalAsk: $("modal-ask"),
};

const STORAGE_KEY = "ansim-yuka:last";
const SAMPLE = "필립스 아벤트 쪽쪽이 비스페놀A 괜찮아? 신생아도 써도 되는지 걱정돼요.";
const VERDICT_CLASS = { SAFE: "v-safe", CAUTION: "v-caution", WARN: "v-warn", INSUFFICIENT: "v-insufficient" };
const VCHIP_CLASS = { SAFE: "vchip--safe", CAUTION: "vchip--caution", WARN: "vchip--warn", INSUFFICIENT: "vchip--insufficient" };

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

/* ===================== 가이드 서가 ===================== */
let GUIDE = { categories: [], topics: [] };
let activeCat = "all";
const TOPIC_BY_ID = {};

async function loadGuide() {
  try {
    const res = await fetch("/api/guide");
    GUIDE = await res.json();
    (GUIDE.topics || []).forEach((t) => (TOPIC_BY_ID[t.id] = t));
    renderFilters();
    renderGuide();
  } catch (_) {
    els.guideLoading.hidden = true;
    els.guideEmpty.hidden = false;
    els.guideEmpty.querySelector(".state__desc").textContent = "가이드를 불러오지 못했어요.";
  }
}

function renderFilters() {
  els.catFilters.innerHTML = "";
  const all = el("button", "chip is-active", "전체");
  all.type = "button";
  all.dataset.cat = "all";
  els.catFilters.appendChild(all);
  (GUIDE.categories || []).forEach((c) => {
    const chip = el("button", "chip", `${c.icon || ""} ${c.name}`.trim());
    chip.type = "button";
    chip.dataset.cat = c.id;
    els.catFilters.appendChild(chip);
  });
  els.catFilters.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCat = chip.dataset.cat;
      els.catFilters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      renderGuide();
    });
  });
}

function renderGuide() {
  els.guideLoading.hidden = true;
  const topics = (GUIDE.topics || []).filter((t) => activeCat === "all" || t.categoryId === activeCat);
  els.guideGrid.innerHTML = "";
  if (!topics.length) {
    els.guideGrid.hidden = true;
    els.guideEmpty.hidden = false;
    return;
  }
  els.guideEmpty.hidden = true;
  els.guideGrid.hidden = false;
  topics.forEach((t) => {
    const card = el("button", "gcard");
    card.type = "button";
    card.setAttribute("aria-haspopup", "dialog");

    const top = el("div", "gcard__top");
    top.append(el("span", "gcard__icon", t.icon || "🔎"), el("span", "gcard__cat", t.category || "가이드"));

    const foot = el("div", "gcard__foot");
    const vchip = el("span", "vchip " + (VCHIP_CLASS[t.verdict] || "vchip--caution"), t.verdictKo || "주의");
    foot.append(vchip, el("span", "gcard__more", "자세히 ›"));

    card.append(top, el("div", "gcard__title", t.title), el("div", "gcard__summary", t.summary || ""), foot);
    card.addEventListener("click", () => openModal(t.id, card));
    els.guideGrid.appendChild(card);
  });
}

/* ===================== 모달 ===================== */
let lastFocused = null;

function fillList(container, section, items, build) {
  container.innerHTML = "";
  const arr = items || [];
  if (section) section.hidden = arr.length === 0;
  arr.forEach((it) => container.appendChild(build(it)));
}

function buildSource(s) {
  const li = el("li", "src");
  let nameNode;
  if (s.url) {
    nameNode = el("a", "src__name src__link", s.name);
    nameNode.href = s.url;
    nameNode.target = "_blank";
    nameNode.rel = "noopener noreferrer";
  } else {
    nameNode = el("div", "src__name", s.name);
  }
  li.append(nameNode, el("div", "src__why", s.why || ""));
  return li;
}

function buildCheck(text) {
  const li = el("li", "ck");
  li.append(el("span", "ck__box"), el("span", "ck__text", text));
  return li;
}

function openModal(id, trigger) {
  const t = TOPIC_BY_ID[id];
  if (!t) return;
  lastFocused = trigger || document.activeElement;

  els.modalIcon.textContent = t.icon || "🔎";
  els.modalCat.textContent = t.category || "안전 가이드";
  els.modalTitle.textContent = t.title;
  els.modalVerdict.className = "verdict__badge " + (VERDICT_CLASS[t.verdict] || "v-caution");
  els.modalVerdict.textContent = t.verdictKo || "주의";
  els.modalSummary.textContent = t.summary || "";

  fillList(els.modalChecklist, els.modalCheckSec, t.checklist, buildCheck);
  fillList(els.modalGaps, els.modalGapSec, t.infoGaps, (g) => el("li", "gap", g));
  fillList(els.modalAlts, els.modalAltSec, t.alternatives, (a) => el("li", "alt", a));
  fillList(els.modalSources, els.modalSrcSec, t.sources, buildSource);

  els.modalAsk.dataset.topicId = id;

  if (typeof els.modal.showModal === "function") els.modal.showModal();
  else els.modal.setAttribute("open", "");
  els.modalClose.focus();
}

function closeModal() {
  if (els.modal.open && typeof els.modal.close === "function") els.modal.close();
  else els.modal.removeAttribute("open");
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

// 모달 → 내 상황으로 물어보기 (Copilot SDK 워크플로 연결)
function askFromTopic() {
  const t = TOPIC_BY_ID[els.modalAsk.dataset.topicId];
  closeModal();
  if (!t) return;
  els.query.value = `${t.title} — ${t.topic} 안전한지, 신생아·영아·유아에게 써도 되는지 확인하고 싶어요.`;
  document.querySelector(".panel--brief").scrollIntoView({ behavior: "smooth", block: "start" });
  runBrief();
}

// 백드롭 클릭으로 닫기 (dialog 영역 밖 클릭)
els.modal.addEventListener("click", (e) => {
  if (e.target === els.modal) closeModal();
});
// ESC: dialog 기본 cancel 처리 + 포커스 복원
els.modal.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeModal();
});

/* ===================== 브리프 (Copilot SDK) ===================== */
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
    els.badge.textContent = "오프라인 근거 엔진";
    els.badge.className = "badge badge--fallback";
  }
}

function renderList(container, block, items, build) {
  container.innerHTML = "";
  const arr = items || [];
  block.hidden = arr.length === 0;
  arr.forEach((it) => container.appendChild(build(it)));
}

function render(data) {
  const b = data.brief || {};
  els.verdictWrap.className = "verdict " + (VERDICT_CLASS[b.verdict] || "v-insufficient");
  els.verdictBadge.textContent = b.verdictKo || "정보부족";
  els.verdictProduct.textContent = (b.product || "입력한 육아템") + (b.category ? ` · ${b.category}` : "");
  els.verdictReason.textContent = b.verdictReason || "";

  renderList(els.agefit, els.ageBlock, b.ageFit, (a) => {
    const card = el("div", "age");
    const head = el("div", "age__head");
    head.append(el("span", "age__stage", a.stage), el("span", "age__fit fit-" + (a.fit || "주의"), a.fit || "주의"));
    card.append(head, el("p", "age__note", a.note || ""));
    return card;
  });
  renderList(els.evidence, els.evidenceBlock, b.evidence, (e) => {
    const li = el("li", "ev");
    li.append(el("span", "ev__axis lv-" + (e.level || "unknown"), e.axisKo || e.axis), el("span", "ev__finding", e.finding || ""));
    return li;
  });
  renderList(els.infogaps, els.gapBlock, b.infoGaps, (g) => el("li", "gap", g));
  renderList(els.checklist, els.checklistBlock, b.checklist, buildCheck);
  renderList(els.alternatives, els.altBlock, b.alternatives, (a) => el("li", "alt", a));
  renderList(els.sources, els.sourcesBlock, b.sources, buildSource);

  els.disclaimer.textContent =
    "ⓘ 본 도구는 의학적 진단·안전성 보증이 아닙니다. 최종 구매 전 위 공신력 출처에서 직접 확인하세요.";

  setBadge(data.source);
  els.hint.textContent = data.notice || "";
  setState("result");
}

async function runBrief() {
  const query = els.query.value.trim();
  if (!query) {
    els.hint.textContent = "먼저 확인할 제품이나 우려를 적어주세요.";
    els.query.focus();
    return;
  }
  els.run.disabled = true;
  els.hint.textContent = "";
  setBadge(null);
  setState("loading");
  try {
    const res = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "요청을 처리하지 못했습니다.");
    render(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ query, data })); } catch (_) {}
  } catch (err) {
    els.errorDetail.textContent = String(err && err.message ? err.message : err);
    setState("error");
  } finally {
    els.run.disabled = false;
  }
}

function restore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const { query, data } = JSON.parse(saved);
    if (query) els.query.value = query;
    if (data && data.brief) render(data);
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

/* ===================== 이벤트 ===================== */
els.run.addEventListener("click", runBrief);
els.retry.addEventListener("click", runBrief);
els.modalClose.addEventListener("click", closeModal);
els.modalAsk.addEventListener("click", askFromTopic);
els.sample.addEventListener("click", () => {
  els.query.value = SAMPLE;
  els.hint.textContent = "예시를 채웠어요. 안전 브리프를 생성해 보세요.";
  els.query.focus();
});
els.clear.addEventListener("click", () => {
  els.query.value = "";
  els.hint.textContent = "";
  setBadge(null);
  setState("empty");
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  els.query.focus();
});

setState("empty");
loadGuide();
restore();
checkHealth();
