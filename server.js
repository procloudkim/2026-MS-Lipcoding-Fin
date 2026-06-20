import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { buildBriefPrompt, parseJson, normalizeBrief, fallbackBrief, categoryTree, guideData } from "./lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.join(__dirname, "public")));

const MODEL = process.env.COPILOT_MODEL || "auto";
const SDK_TIMEOUT_MS = Number(process.env.SDK_TIMEOUT_MS || 60000);
const MAX_INPUT = 2000;
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
  res.json({ ok: true, app: "ansim-yuka", model: MODEL, authMode: AUTH_MODE });
});

// MECE 카테고리/안전축/공신력 출처 트리 (탐색 + 구조 증거)
app.get("/api/categories", (_req, res) => {
  res.json(categoryTree());
});

// 안심 가이드 서가: 카테고리 + 큐레이션 안전 주제(카드/모달용 읽기 전용)
app.get("/api/guide", (_req, res) => {
  res.json(guideData());
});

// 제품/우려 -> Copilot SDK가 구조화한 안전 브리프
app.post("/api/brief", async (req, res) => {
  const input = String(req.body?.query ?? req.body?.text ?? "").trim().slice(0, MAX_INPUT);
  if (!input) {
    return res.status(400).json({ error: "EMPTY_INPUT", message: "확인할 제품이나 우려를 입력해주세요." });
  }
  try {
    const raw = await runAgent(buildBriefPrompt(input));
    const brief = normalizeBrief(parseJson(raw));
    if (!brief) throw new Error("Copilot SDK 응답을 안전 브리프로 구조화하지 못했습니다.");
    return res.json({ source: "copilot-sdk", model: MODEL, authMode: AUTH_MODE, brief });
  } catch (err) {
    return res.json({
      source: "fallback",
      model: null,
      brief: fallbackBrief(input),
      notice: "Copilot SDK 미연결 — 오프라인 근거 엔진으로 처리했습니다.",
      detail: String(err?.message || err),
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[ansim-yuka] listening on http://localhost:${port} (model=${MODEL}, auth=${AUTH_MODE})`);
});
