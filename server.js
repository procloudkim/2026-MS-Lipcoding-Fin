import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { CopilotClient, approveAll } from "@github/copilot-sdk";
import {
  buildPlanPrompt,
  buildAssistPrompt,
  parseJson,
  normalizePlan,
  normalizeArtifact,
  fallbackPlan,
  fallbackArtifact,
} from "./lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// 런타임(@github/copilot) 위치를 견고하게 해석한다.
// Azure의 compressed node_modules / 중첩 설치 등 레이아웃 차이를 흡수.
function existing(p) {
  try { return p && fs.existsSync(p) ? p : null; } catch { return null; }
}
function findCopilotDir() {
  const bases = [];
  try { bases.push(path.dirname(require.resolve("@github/copilot-sdk"))); } catch {}
  bases.push(process.cwd(), __dirname, "/");
  for (const base of bases) {
    try {
      const pj = require.resolve("@github/copilot/package.json", { paths: [base] });
      return path.dirname(pj);
    } catch {}
  }
  const roots = ["/node_modules", path.join(process.cwd(), "node_modules"), path.join(__dirname, "node_modules")];
  for (const root of roots) {
    const direct = existing(path.join(root, "@github", "copilot"));
    if (direct) return direct;
    const nested = existing(path.join(root, "@github", "copilot-sdk", "node_modules", "@github", "copilot"));
    if (nested) return nested;
  }
  return null;
}
function resolveCliPath() {
  const envp = existing(process.env.COPILOT_CLI_PATH);
  if (envp) return envp;
  const dir = findCopilotDir();
  if (!dir) return null;
  const names = ["index.js", "npm-loader.js", "dist/index.js", "dist/cjs/index.js"];
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    if (pj.bin) {
      const b = typeof pj.bin === "string" ? pj.bin : Object.values(pj.bin)[0];
      if (b) names.unshift(b);
    }
    if (pj.main) names.unshift(pj.main);
  } catch {}
  for (const n of names) {
    const p = existing(path.join(dir, n));
    if (p) return p;
  }
  return path.join(dir, "index.js");
}
const RESOLVED_CLI = resolveCliPath();
if (RESOLVED_CLI) {
  process.env.COPILOT_CLI_PATH = RESOLVED_CLI;
  console.log("[haru-autopilot] resolved Copilot CLI runtime: " + RESOLVED_CLI);
} else {
  console.log("[haru-autopilot] Copilot CLI runtime not found; SDK will fall back.");
}

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.join(__dirname, "public")));

const MODEL = process.env.COPILOT_MODEL || "auto";
const SDK_TIMEOUT_MS = Number(process.env.SDK_TIMEOUT_MS || 60000);
const MAX_INPUT = 6000;
// 비대화식 서버 인증용 GitHub 토큰 (있으면 token 모드, 없으면 로그인 사용자 모드)
const GH_TOKEN =
  process.env.COPILOT_GH_TOKEN ||
  process.env.COPILOT_SDK_AUTH_TOKEN ||
  process.env.GITHUB_TOKEN ||
  "";
const AUTH_MODE = GH_TOKEN ? "token" : "login";

let clientPromise = null;
async function getClient() {
  if (!clientPromise) {
    const client = new CopilotClient(
      GH_TOKEN ? { gitHubToken: GH_TOKEN, useLoggedInUser: false } : {}
    );
    clientPromise = client
      .start()
      .then(() => client)
      .catch((err) => {
        clientPromise = null;
        throw err;
      });
  }
  return clientPromise;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function runAgent(prompt) {
  const client = await getClient();
  const session = await client.createSession({ model: MODEL, onPermissionRequest: approveAll });
  try {
    let buffer = "";
    const done = new Promise((resolve) => {
      session.on("assistant.message", (event) => {
        buffer += event?.data?.content ?? "";
      });
      session.on("session.idle", () => resolve());
    });
    await session.send({ prompt });
    await withTimeout(done, SDK_TIMEOUT_MS, "Copilot SDK response");
    return buffer;
  } finally {
    await session.disconnect().catch(() => {});
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "haru-autopilot", model: MODEL, authMode: AUTH_MODE });
});

// 맥락 -> 결정/타임라인/첫 작업물
app.post("/api/plan", async (req, res) => {
  const input = String(req.body?.context ?? req.body?.text ?? "").trim().slice(0, MAX_INPUT);
  if (!input) {
    return res.status(400).json({ error: "EMPTY_INPUT", message: "오늘의 맥락을 입력해주세요." });
  }
  try {
    const raw = await runAgent(buildPlanPrompt(input));
    const plan = normalizePlan(parseJson(raw));
    if (!plan) throw new Error("Copilot SDK 응답을 계획으로 구조화하지 못했습니다.");
    return res.json({ source: "copilot-sdk", model: MODEL, authMode: AUTH_MODE, plan });
  } catch (err) {
    return res.json({
      source: "fallback",
      model: null,
      plan: fallbackPlan(input),
      notice: "Copilot SDK 미연결 — 오프라인 결정 엔진으로 처리했습니다.",
      detail: String(err?.message || err),
    });
  }
});

// 특정 작업 -> 즉시 시작용 작업물 (멀티스텝 에이전트 호출)
app.post("/api/assist", async (req, res) => {
  const task = String(req.body?.task ?? "").trim().slice(0, 1000);
  const type = String(req.body?.type ?? "").trim();
  if (!task) {
    return res.status(400).json({ error: "EMPTY_TASK", message: "도와줄 작업을 지정해주세요." });
  }
  try {
    const raw = await runAgent(buildAssistPrompt(task, type));
    const artifact = normalizeArtifact(parseJson(raw));
    if (!artifact) throw new Error("Copilot SDK 작업물 생성에 실패했습니다.");
    return res.json({ source: "copilot-sdk", model: MODEL, artifact });
  } catch (err) {
    return res.json({
      source: "fallback",
      artifact: fallbackArtifact(task, type),
      notice: "Copilot SDK 미연결 — 오프라인 템플릿으로 생성했습니다.",
      detail: String(err?.message || err),
    });
  }
});

// 진단용(게이트). Azure 런타임 위치 파악. 비밀은 노출하지 않음.
app.get("/api/_diag", (req, res) => {
  if ((req.query.key || "") !== "autopilot") return res.status(404).end();
  const out = { cwd: process.cwd(), dirname: __dirname, resolvedCli: RESOLVED_CLI, envCli: process.env.COPILOT_CLI_PATH || null, authMode: AUTH_MODE };
  try { out.sdkMain = require.resolve("@github/copilot-sdk"); } catch (e) { out.sdkMain = "ERR " + e.message; }
  const dir = findCopilotDir();
  out.copilotDir = dir;
  if (dir) {
    try { out.copilotDirList = fs.readdirSync(dir).slice(0, 60); } catch (e) { out.copilotDirList = "ERR " + e.message; }
    out.hasIndexJs = existing(path.join(dir, "index.js")) ? true : false;
    out.hasNpmLoader = existing(path.join(dir, "npm-loader.js")) ? true : false;
  }
  for (const root of ["/node_modules/@github", path.join(process.cwd(), "node_modules", "@github")]) {
    try { out["ls:" + root] = fs.readdirSync(root); } catch (e) { out["ls:" + root] = "ERR " + e.code; }
  }
  res.json(out);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[haru-autopilot] listening on http://localhost:${port} (model=${MODEL}, auth=${AUTH_MODE})`);
});
