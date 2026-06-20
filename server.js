import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { buildPrompt, parseResult, fallbackResult } from "./lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.join(__dirname, "public")));

const MODEL = process.env.COPILOT_MODEL || "auto";
const SDK_TIMEOUT_MS = Number(process.env.SDK_TIMEOUT_MS || 60000);
const MAX_INPUT = 6000;

let clientPromise = null;
async function getClient() {
  if (!clientPromise) {
    const client = new CopilotClient();
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

async function runWithCopilot(text) {
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
    await session.send({ prompt: buildPrompt(text) });
    await withTimeout(done, SDK_TIMEOUT_MS, "Copilot SDK response");
    const parsed = parseResult(buffer);
    if (!parsed) throw new Error("Copilot SDK 응답을 구조화하지 못했습니다.");
    return parsed;
  } finally {
    await session.disconnect().catch(() => {});
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "haru-jeongri", model: MODEL });
});

app.post("/api/copilot", async (req, res) => {
  const input = String(req.body?.text ?? "").trim().slice(0, MAX_INPUT);
  if (!input) {
    return res.status(400).json({ error: "EMPTY_INPUT", message: "정리할 내용을 입력해주세요." });
  }
  try {
    const result = await runWithCopilot(input);
    return res.json({ source: "copilot-sdk", model: MODEL, result });
  } catch (err) {
    const result = fallbackResult(input);
    return res.json({
      source: "fallback",
      model: null,
      result,
      notice: "Copilot SDK 미연결 — 오프라인 정리 모드로 처리했습니다.",
      detail: String(err?.message || err),
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[haru-jeongri] listening on http://localhost:${port} (model=${MODEL})`);
});
