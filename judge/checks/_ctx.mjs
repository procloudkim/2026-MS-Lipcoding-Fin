// judge/checks/_ctx.mjs
// 공용 헬퍼: 결과 객체 빌더, 타임아웃 fetch, 로컬 서버 부팅/헬스대기, 파일 IO.
import { spawn } from "node:child_process";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const STATUSES = ["PASS", "FAIL", "WARN", "SKIP"];
export const SEVERITIES = ["critical", "high", "medium", "low", "info"];

// 동기 sleep (transient FS 잠금 재시도용)
function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      /* spin */
    }
  }
}

// 단일 체크 결과를 표준 형태로 만든다.
// status: PASS | FAIL | WARN | SKIP
// opts: { evidence, fix, gate(GID), dim(차원id), weight, sec(보안 severity) }
export function chk(name, status, opts = {}) {
  const { evidence = "", fix = "", gate = null, dim = null, weight = 1, sec = null } = opts;
  if (!STATUSES.includes(status)) {
    throw new Error(`알 수 없는 status: ${status} (${name})`);
  }
  if (sec != null && !SEVERITIES.includes(sec)) {
    throw new Error(`알 수 없는 severity: ${sec} (${name})`);
  }
  return { name, status, evidence: String(evidence), fix: String(fix), gate, dim, weight, sec };
}

// 외부 명령 실행(동기, 타임아웃). 보안 검사용(npm audit, git ls-files).
// 반환: { ok, code, stdout, stderr, error }
export function runCmd(cmd, args, { cwd, timeoutMs = 30000, shell } = {}) {
  const useShell = shell == null ? process.platform === "win32" : shell;
  try {
    const r = spawnSync(cmd, args, {
      cwd,
      timeout: timeoutMs,
      encoding: "utf8",
      shell: useShell, // npm.cmd 등은 shell 필요; git 은 shell:false 로 호출 가능
      windowsHide: true,
      maxBuffer: 12 * 1024 * 1024,
    });
    if (r.error) return { ok: false, code: null, stdout: r.stdout || "", stderr: r.stderr || "", error: String(r.error.message || r.error) };
    return { ok: r.status === 0, code: r.status, stdout: r.stdout || "", stderr: r.stderr || "", error: null };
  } catch (err) {
    return { ok: false, code: null, stdout: "", stderr: "", error: String(err?.message || err) };
  }
}

// 파일 읽기. ENOENT 는 즉시 null. 그 외 일시적 오류(EBUSY/EPERM/EMFILE 등)는 재시도.
// 심사기는 false FAIL 을 내면 안 되므로 transient 잠금에 견고해야 한다.
export function readText(p) {
  for (let i = 0; i < 5; i++) {
    try {
      return fs.readFileSync(p, "utf8");
    } catch (err) {
      if (err && err.code === "ENOENT") return null;
      sleepSync(30 * (i + 1));
    }
  }
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

// 존재 확인. ENOENT 는 false. 그 외 일시 오류는 재시도 후 best-effort.
export function exists(p) {
  for (let i = 0; i < 5; i++) {
    try {
      fs.statSync(p);
      return true;
    } catch (err) {
      if (err && err.code === "ENOENT") return false;
      sleepSync(30 * (i + 1));
    }
  }
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

export function listFiles(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 타임아웃이 있는 fetch. 네트워크/파싱 실패를 던지지 않고 결과로 돌려준다.
export async function fetchJson(url, { method = "GET", body, headers } = {}, timeoutMs = 8000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json", ...(headers || {}) },
      body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      signal: ac.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not json */
    }
    return { ok: res.ok, status: res.status, json, text, error: null };
  } catch (err) {
    return { ok: false, status: 0, json: null, text: "", error: String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(url, opts = {}, timeoutMs = 8000) {
  const r = await fetchJson(url, opts, timeoutMs);
  return { ok: r.ok, status: r.status, text: r.text, error: r.error };
}

// server.js 텍스트에서 라우트를 추출(프로젝트마다 엔드포인트가 다르므로 일반화).
export function discoverRoutes(serverText) {
  const posts = [];
  const gets = [];
  const re = /app\.(get|post|put|delete)\(\s*["'](\/[A-Za-z0-9_\-/]*)["']/g;
  for (const m of String(serverText || "").matchAll(re)) {
    const method = m[1].toLowerCase();
    const route = m[2];
    if (method === "post") posts.push(route);
    else if (method === "get") gets.push(route);
  }
  return { posts: [...new Set(posts)], gets: [...new Set(gets)] };
}

// 한국어 샘플 맥락(생산성 입력).
export const SAMPLE_CONTEXT = [
  "분기 보고서 초안 쓰기",
  "팀 회의 자료 준비",
  "저녁에 운동 30분",
  "부모님께 전화",
  "세금 서류 확인",
].join("\n");

// 핸들러가 어떤 키를 읽는지 모르므로 흔한 키를 모두 채운 본문(2xx 유도용).
export function sampleBody() {
  return {
    context: SAMPLE_CONTEXT,
    text: SAMPLE_CONTEXT,
    input: SAMPLE_CONTEXT,
    prompt: SAMPLE_CONTEXT,
    content: SAMPLE_CONTEXT,
    message: "팀 회의 준비를 도와줘",
    task: "팀 회의 준비",
    type: "agenda",
    items: SAMPLE_CONTEXT.split("\n"),
    query: "오늘 우선순위 정리",
  };
}

// 서버 준비 대기. /api/health 가 있으면 그 json 을 캡처하지만,
// 없더라도 GET / 가 HTTP 응답을 주면 '부팅됨'으로 간주(프로젝트마다 health 라우트가 없을 수 있음).
export async function waitForHealth(baseUrl, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const h = await fetchJson(`${baseUrl}/api/health`, {}, 1500);
    if (h.ok && h.json && h.json.ok === true) return { ok: true, health: h.json };
    last = h;
    // health 가 없거나 200이 아니어도, 루트가 응답하면 서버는 살아있다.
    const root = await fetchJson(`${baseUrl}/`, {}, 1500);
    if (root.status > 0) return { ok: true, health: h.json && h.json.ok ? h.json : null };
    last = root.status > 0 ? root : last;
    await sleep(400);
  }
  return { ok: false, health: null, error: last?.error || `readiness timeout (${timeoutMs}ms)` };
}

// 로컬 server.js 를 별도 프로세스로 부팅하고 헬스가 OK 될 때까지 대기.
// 반환: { ok, baseUrl, health, stop(), logs() }  /  실패 시 { ok:false, error, logs() }
export async function startServer({ repoRoot, port = 4123, env = {}, timeoutMs = 25000 } = {}) {
  const serverPath = path.join(repoRoot, "server.js");
  if (!exists(serverPath)) {
    return { ok: false, error: `server.js 없음: ${serverPath}`, logs: () => "" };
  }
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      // 하니스 결정성을 위해 SDK 시도 타임아웃을 짧게. (실패 시 fallback 으로 빠르게 전환)
      SDK_TIMEOUT_MS: process.env.JUDGE_SDK_TIMEOUT_MS || "8000",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let out = "";
  child.stdout?.on("data", (d) => (out += d.toString()));
  child.stderr?.on("data", (d) => (out += d.toString()));

  let exited = false;
  let exitInfo = null;
  child.on("exit", (code, signal) => {
    exited = true;
    exitInfo = { code, signal };
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (exited) return;
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    // 짧게 종료 대기
    for (let i = 0; i < 20 && !exited; i++) await sleep(100);
  };

  const health = await waitForHealth(baseUrl, timeoutMs);
  if (!health.ok || exited) {
    await stop();
    // 흔한 부팅 실패를 친절한 메시지로 분류.
    let hint = "";
    if (/ERR_MODULE_NOT_FOUND|Cannot find package|Cannot find module/i.test(out)) hint = "의존성 미설치 — 대상 폴더에서 npm install 필요";
    else if (/EADDRINUSE/i.test(out)) hint = `포트 ${port} 사용 중 — --port 로 다른 포트 지정`;
    else if (/SyntaxError/i.test(out)) hint = "server.js 구문 오류";
    const tail = String(out).replace(/\s+/g, " ").trim().slice(-160);
    return {
      ok: false,
      error: (hint ? `${hint}. ` : exited ? `서버 조기 종료(code=${exitInfo?.code}). ` : `${health.error}. `) + (tail ? `로그: …${tail}` : ""),
      logs: () => out,
    };
  }
  return { ok: true, baseUrl, health: health.health, stop, logs: () => out };
}
