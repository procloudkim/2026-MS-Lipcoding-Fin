const $ = (id) => document.getElementById(id);

const els = {
  dump: $("brain-dump"),
  organize: $("organize"),
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
  summary: $("summary"),
  top3: $("top3"),
  categories: $("categories"),
  tomorrow: $("tomorrow"),
  health: $("health"),
};

const STORAGE_KEY = "haru-jeongri:last";

const SAMPLE = [
  "분기 보고서 초안 쓰기",
  "팀 회의 자료 준비",
  "저녁에 운동 30분",
  "부모님께 전화드리기",
  "세금 서류 확인",
  "밀린 이메일 답장",
].join("\n");

function setState(name) {
  els.empty.hidden = name !== "empty";
  els.loading.hidden = name !== "loading";
  els.error.hidden = name !== "error";
  els.result.hidden = name !== "result";
}

function setBadge(source) {
  if (!source) {
    els.badge.hidden = true;
    return;
  }
  els.badge.hidden = false;
  if (source === "copilot-sdk") {
    els.badge.textContent = "Copilot SDK";
    els.badge.className = "badge badge--sdk";
  } else {
    els.badge.textContent = "오프라인 정리 모드";
    els.badge.className = "badge badge--fallback";
  }
}

function render(data) {
  const r = data.result || {};
  els.summary.textContent = r.summary || "";
  els.summary.hidden = !r.summary;

  els.top3.innerHTML = "";
  (r.top3 || []).forEach((it) => {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "t-title";
    title.textContent = it.title || "";
    li.appendChild(title);
    if (it.reason) {
      const reason = document.createElement("div");
      reason.className = "t-reason";
      reason.textContent = it.reason;
      li.appendChild(reason);
    }
    els.top3.appendChild(li);
  });

  els.categories.innerHTML = "";
  (r.categories || []).forEach((c) => {
    const wrap = document.createElement("div");
    wrap.className = "cat";
    const name = document.createElement("div");
    name.className = "cat__name";
    name.textContent = c.name || "";
    const ul = document.createElement("ul");
    ul.className = "cat__items";
    (c.items || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    wrap.appendChild(name);
    wrap.appendChild(ul);
    els.categories.appendChild(wrap);
  });

  els.tomorrow.innerHTML = "";
  (r.tomorrow || []).forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    els.tomorrow.appendChild(li);
  });

  setBadge(data.source);
  els.hint.textContent = data.notice || "";
  setState("result");
}

async function organize() {
  const text = els.dump.value.trim();
  if (!text) {
    els.hint.textContent = "먼저 오늘의 메모를 적어주세요.";
    els.dump.focus();
    return;
  }
  els.organize.disabled = true;
  els.hint.textContent = "";
  setBadge(null);
  setState("loading");
  try {
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "요청을 처리하지 못했습니다.");
    }
    render(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, data }));
    } catch (_) {}
  } catch (err) {
    els.errorDetail.textContent = String(err && err.message ? err.message : err);
    setState("error");
  } finally {
    els.organize.disabled = false;
  }
}

function restore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const { text, data } = JSON.parse(saved);
    if (text) els.dump.value = text;
    if (data && data.result) render(data);
  } catch (_) {}
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    els.health.textContent = data.ok ? "서버 정상" : "서버 점검 필요";
    els.health.className = "footer__health " + (data.ok ? "ok" : "down");
  } catch (_) {
    els.health.textContent = "서버 연결 안 됨";
    els.health.className = "footer__health down";
  }
}

els.organize.addEventListener("click", organize);
els.retry.addEventListener("click", organize);
els.sample.addEventListener("click", () => {
  els.dump.value = SAMPLE;
  els.hint.textContent = "예시를 채웠어요. 바로 정리해 보세요.";
  els.dump.focus();
});
els.clear.addEventListener("click", () => {
  els.dump.value = "";
  els.hint.textContent = "";
  setBadge(null);
  setState("empty");
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  els.dump.focus();
});

setState("empty");
restore();
checkHealth();
