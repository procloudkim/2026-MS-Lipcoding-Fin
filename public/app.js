const $ = (id) => document.getElementById(id);

const els = {
  query: $("query"),
  run: $("run"),
  sample: $("sample"),
  clear: $("clear"),
  retry: $("retry"),
  hint: $("hint"),
  badge: $("source-badge"),
  catChips: $("cat-chips"),
  itemChips: $("item-chips"),
  empty: $("empty-state"),
  loading: $("loading-state"),
  error: $("error-state"),
  errorDetail: $("error-detail"),
  result: $("result"),
  verdictBadge: $("verdict-badge"),
  verdictProduct: $("verdict-product"),
  verdictReason: $("verdict-reason"),
  verdictWrap: null,
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
};
els.verdictWrap = document.querySelector(".verdict");

const STORAGE_KEY = "ansim-yuka:last";
const SAMPLE = "필립스 아벤트 쪽쪽이 비스페놀A 괜찮아? 신생아도 써도 되는지 걱정돼요.";

const VERDICT_CLASS = {
  SAFE: "v-safe",
  CAUTION: "v-caution",
  WARN: "v-warn",
  INSUFFICIENT: "v-insufficient",
};

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

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

  renderList(els.checklist, els.checklistBlock, b.checklist, (c) => {
    const li = el("li", "ck");
    li.append(el("span", "ck__box"), el("span", "ck__text", c));
    return li;
  });

  renderList(els.alternatives, els.altBlock, b.alternatives, (a) => el("li", "alt", a));

  renderList(els.sources, els.sourcesBlock, b.sources, (s) => {
    const li = el("li", "src");
    li.append(el("div", "src__name", s.name), el("div", "src__why", s.why || ""));
    return li;
  });

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

let activeCat = null;
function renderItemChips(cat) {
  els.itemChips.innerHTML = "";
  if (!cat) { els.itemChips.hidden = true; return; }
  els.itemChips.hidden = false;
  cat.items.forEach((item) => {
    const clean = item.replace(/\(.*?\)/g, "");
    const chip = el("button", "item-chip", item);
    chip.type = "button";
    chip.addEventListener("click", () => {
      els.query.value = `${clean} 안전성·환경호르몬·인증 확인`;
      els.query.focus();
    });
    els.itemChips.appendChild(chip);
  });
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    (data.categories || []).forEach((cat) => {
      const chip = el("button", "cat-chip", `${cat.icon || ""} ${cat.name}`.trim());
      chip.type = "button";
      chip.addEventListener("click", () => {
        const wasActive = activeCat === cat.id;
        activeCat = wasActive ? null : cat.id;
        document.querySelectorAll(".cat-chip").forEach((c) => c.classList.remove("is-active"));
        if (!wasActive) chip.classList.add("is-active");
        renderItemChips(wasActive ? null : cat);
      });
      els.catChips.appendChild(chip);
    });
  } catch (_) {}
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

els.run.addEventListener("click", runBrief);
els.retry.addEventListener("click", runBrief);
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
loadCategories();
restore();
checkHealth();
