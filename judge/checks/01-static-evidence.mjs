// judge/checks/01-static-evidence.mjs
// 정적 증거: 코드/문서를 읽어 SDK 코드경로, 생산성 카테고리, 문서<->코드 드리프트,
// 시크릿/.gitignore, 의사결정 기록 존재를 검사한다. (서버 불필요)
import path from "node:path";
import { chk, readText, exists, listFiles } from "./_ctx.mjs";

const has = (text, re) => !!text && re.test(text);

const SECRET_PATTERNS = [
  { name: "GitHub PAT(classic)", re: /ghp_[A-Za-z0-9]{20,}/ },
  { name: "GitHub PAT(fine)", re: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: "AWS Access Key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Private Key block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Azure/Client secret", re: /(?:AccountKey|SharedAccessKey|client_secret|ClientSecret)\s*[=:]\s*["']?[A-Za-z0-9+/]{20,}/i },
];

export default async function run(ctx) {
  const { repoRoot } = ctx;
  const checks = [];
  const P = (f) => path.join(repoRoot, f);

  const pkgRaw = readText(P("package.json"));
  let pkg = {};
  try {
    pkg = JSON.parse(pkgRaw || "{}");
  } catch {
    /* ignore */
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const server = readText(P("server.js")) || "";
  const lib = readText(P("lib.js")) || "";
  const readme = readText(P("README.md")) || "";
  const instructions = readText(P(".github/copilot-instructions.md")) || "";
  const gitignore = readText(P(".gitignore")) || "";

  // ---- G2 / sdk-depth : Copilot SDK 실제 코드경로 ----
  checks.push(
    chk("package.json 에 @github/copilot-sdk 의존성", deps["@github/copilot-sdk"] ? "PASS" : "FAIL", {
      gate: "G2",
      evidence: deps["@github/copilot-sdk"] ? `@github/copilot-sdk@${deps["@github/copilot-sdk"]}` : "의존성 없음",
      fix: "package.json dependencies 에 @github/copilot-sdk 추가",
    })
  );
  checks.push(
    chk("server.js 에서 Copilot SDK import", has(server, /from\s+["']@github\/copilot-sdk["']/) ? "PASS" : "FAIL", {
      gate: "G2",
      evidence: 'import { CopilotClient, approveAll } from "@github/copilot-sdk"',
      fix: "server.js 상단에서 @github/copilot-sdk import",
    })
  );
  const sessionCreate = has(server, /createSession\s*\(/);
  const clientNew = has(server, /new\s+CopilotClient\s*\(/);
  checks.push(
    chk("SDK 세션 생성 코드경로", sessionCreate && clientNew ? "PASS" : "FAIL", {
      gate: "G2",
      dim: "sdk-depth",
      weight: 2,
      evidence: `new CopilotClient(): ${clientNew}, createSession(): ${sessionCreate}`,
      fix: "client.createSession({ model, onPermissionRequest }) 호출 추가",
    })
  );
  // 엔드포인트 추출 (실제 라우트)
  const epRe = /app\.(get|post|put|delete)\(\s*["'](\/api\/[A-Za-z0-9_\-/]*)["']/g;
  const endpoints = new Set();
  for (const m of server.matchAll(epRe)) endpoints.add(`${m[1].toUpperCase()} ${m[2]}`);
  const apiPaths = new Set([...endpoints].map((e) => e.split(" ")[1]));
  const sdkBacked = has(server, /runAgent\s*\(/) || has(server, /session\.send\s*\(/);
  checks.push(
    chk("SDK-backed API 엔드포인트 존재", apiPaths.size > 0 && sdkBacked ? "PASS" : "FAIL", {
      gate: "G2",
      dim: "sdk-depth",
      weight: 2,
      evidence: `라우트: ${[...endpoints].join(", ") || "없음"} / session.send: ${sdkBacked}`,
      fix: "사용자 워크플로우에 연결된 라우트에서 SDK 세션 호출",
    })
  );
  checks.push(
    chk("SDK end-to-end 핸들러(assistant.message + idle)", has(server, /assistant\.message/) && has(server, /session\.idle/) ? "PASS" : "WARN", {
      dim: "sdk-depth",
      weight: 2,
      evidence: `assistant.message: ${has(server, /assistant\.message/)}, session.idle: ${has(server, /session\.idle/)}`,
      fix: "assistant.message 수집 + session.idle 종료로 응답을 끝까지 처리",
    })
  );
  checks.push(
    chk("@github/copilot 런타임 의존성", deps["@github/copilot"] ? "PASS" : "WARN", {
      dim: "sdk-depth",
      evidence: deps["@github/copilot"] ? `@github/copilot@${deps["@github/copilot"]}` : "런타임 의존성 미선언(전역 CLI 의존 가능)",
      fix: "재현성을 위해 @github/copilot 런타임을 의존성에 포함 권장",
    })
  );

  // ---- G1 : 개인 생산성 향상 웹앱 ----
  const prodHit = has(readme, /개인\s*생산성|생산성\s*향상|productivity/i) || has(instructions, /personal productivity/i);
  checks.push(
    chk("개인 생산성 웹앱 카테고리 명시", prodHit ? "PASS" : "FAIL", {
      gate: "G1",
      dim: "productivity",
      weight: 2,
      evidence: prodHit ? "README/instructions 에 생산성 카테고리 명시" : "생산성 카테고리 근거 미발견",
      fix: "README 에 개인 생산성 향상 웹앱임을 명시",
    })
  );
  const workflowHit = has(readme, /우선순위|할\s*일|정리|결정|계획|타임라인/);
  checks.push(
    chk("결정/정리 워크플로우 서술", workflowHit ? "PASS" : "WARN", {
      dim: "productivity",
      evidence: workflowHit ? "결정 비용 절감형 워크플로우 서술 존재" : "워크플로우 서술 약함",
      fix: "입력→정리/우선순위→다음 행동으로 이어지는 워크플로우를 README 에 서술",
    })
  );

  // ---- honesty : 문서<->코드 일치 ----
  const readmeApiMentions = new Set();
  // 라우트 토큰만 정확히 추출(마크다운 강조 등 꼬리문자 배제). 끝의 비단어/하이픈 정리.
  for (const m of readme.matchAll(/\/api\/[A-Za-z0-9_]+/g)) readmeApiMentions.add(m[0]);
  const drift = [...readmeApiMentions].filter((p) => !apiPaths.has(p) && p !== "/api/health" && p !== "/api/_diag");
  checks.push(
    chk("README API 경로 = 실제 서버 라우트", drift.length === 0 ? "PASS" : "WARN", {
      dim: "honesty",
      weight: 2,
      evidence:
        drift.length === 0
          ? `일치 (서버: ${[...apiPaths].join(", ")})`
          : `README 언급 ${drift.join(", ")} 가 server.js 라우트(${[...apiPaths].join(", ")})에 없음`,
      fix: "README 의 엔드포인트 표기를 실제 라우트와 일치시키기",
    })
  );
  checks.push(
    chk("환경별 정직한 분리(source 배지/fallback) 서술", has(readme, /fallback|오프라인|source/i) ? "PASS" : "WARN", {
      dim: "honesty",
      evidence: has(readme, /fallback|오프라인|source/i) ? "환경별 source 분리 서술 존재" : "환경 분리 서술 미발견",
      fix: "로컬(copilot-sdk) vs 배포(fallback) 차이를 README 에 명시",
    })
  );

  // ---- engineering : 견고한 코어 ----
  const hasFallback = /function\s+\w*[Ff]allback\w*|\b\w*[Ff]allback\w*\s*=|\b\w*[Ff]allback\w*\s*\(/.test(lib);
  checks.push(
    chk("결정적 fallback 로직 존재(lib.js)", hasFallback ? "PASS" : "FAIL", {
      dim: "engineering",
      weight: 2,
      evidence: hasFallback ? "fallback 함수 존재(예: fallbackPlan/fallbackBrief/fallbackSummary)" : "fallback 미발견",
      fix: "네트워크 비의존 결정적 fallback 구현",
    })
  );
  checks.push(
    chk("견고한 JSON 파서 존재(lib.js)", has(lib, /parseJson/) ? "PASS" : "WARN", {
      dim: "engineering",
      evidence: has(lib, /parseJson/) ? "parseJson 존재" : "robust 파서 미발견",
      fix: "코드블록/잡텍스트를 견디는 JSON 파서 추가",
    })
  );

  // ---- G6 : 시크릿/.gitignore ----
  const gi = (re) => has(gitignore, re);
  const giEnv = gi(/(^|\n)\.env(\b|\n)/);
  const giNode = gi(/node_modules/);
  const giAzure = gi(/\.azure/);
  const missing = [!giEnv && ".env", !giNode && "node_modules/", !giAzure && ".azure/"].filter(Boolean);
  // 실제 위험: .env 파일이 존재하는데 무시되지 않음(진짜 유출 가능) → FAIL.
  // 단순히 항목이 빠진 것(파일은 없음)은 WARN(게이트는 통과).
  const realEnvRisk = exists(P(".env")) && !giEnv;
  checks.push(
    chk(
      ".gitignore 시크릿/산출물 보호",
      realEnvRisk ? "FAIL" : missing.length === 0 ? "PASS" : "WARN",
      {
        gate: "G6",
        evidence: realEnvRisk
          ? ".env 파일이 존재하나 .gitignore 에서 무시되지 않음(유출 위험)"
          : missing.length === 0
            ? ".env, node_modules/, .azure/ 무시"
            : `보호 항목 누락: ${missing.join(", ")} (해당 파일은 미존재 → 경고)`,
        fix: `.gitignore 에 ${missing.join(", ") || ".env/.azure/node_modules"} 추가`,
      }
    )
  );
  // 시크릿 스캔 (정해진 텍스트 파일만, node_modules 제외)
  const scanTargets = [
    "server.js",
    "lib.js",
    "package.json",
    "README.md",
    ".env.example",
    "public/index.html",
    "public/app.js",
    "public/styles.css",
    "scripts/smoke.js",
    "docs/evaluation/AI_JUDGE_BRIEF.md",
    "docs/adr/0001-branch-and-azure-smoke-strategy.md",
    "docs/adr/0002-copilot-sdk-integration.md",
  ];
  const leaks = [];
  for (const f of scanTargets) {
    const t = readText(P(f));
    if (!t) continue;
    for (const pat of SECRET_PATTERNS) {
      if (pat.re.test(t)) leaks.push(`${f}: ${pat.name}`);
    }
  }
  const realEnvTracked = exists(P(".env"));
  checks.push(
    chk("커밋 후보 파일에 시크릿 없음", leaks.length === 0 ? "PASS" : "FAIL", {
      gate: "G6",
      evidence: leaks.length === 0 ? `스캔 ${scanTargets.length}개 파일 클린${realEnvTracked ? " (단, 루트 .env 존재→ignore 확인 필요)" : ""}` : leaks.join("; "),
      fix: "노출된 토큰/키 제거 후 회수(rotate), .env 로 이동 + .gitignore 확인",
    })
  );

  // ---- G7 (대회 필수) : 리포 루트 PRD.md = 심사 Source of Truth ----
  const prd = readText(P("PRD.md"));
  const adrDirHits = ["docs/adr"].some((d) => exists(P(d)));
  if (!prd) {
    checks.push(
      chk("PRD.md (리포 루트, 대회 필수)", "FAIL", {
        gate: "G7",
        dim: "docs",
        weight: 3,
        evidence: "리포 루트에 PRD.md 없음 — 대회 제출 필수(AI 심사 Source of Truth)",
        fix: "리포 루트에 PRD.md 작성: 한 줄 정의·문제/사용자·기능별 엔드포인트·Copilot SDK 경로·배포 URL·검증 시나리오",
      })
    );
  } else {
    // PRD 품질: 검증가능한 시나리오/엔드포인트/배포URL/SDK 언급 여부
    const hasEndpoints = /\/api\//.test(prd);
    const hasDeploy = /azurewebsites\.net|https?:\/\//.test(prd);
    const hasSdk = /copilot[- ]?sdk|@github\/copilot/i.test(prd);
    const hasScenario = /시나리오|검증|smoke|수락|acceptance|단계|→/i.test(prd);
    const q = [hasEndpoints, hasDeploy, hasSdk, hasScenario].filter(Boolean).length;
    checks.push(
      chk("PRD.md (리포 루트, 대회 필수)", q >= 3 ? "PASS" : "WARN", {
        gate: "G7",
        dim: "docs",
        weight: 3,
        evidence: `PRD.md 존재(${prd.length}자) — 엔드포인트:${hasEndpoints} 배포URL:${hasDeploy} SDK:${hasSdk} 시나리오:${hasScenario}`,
        fix: q >= 3 ? "" : "PRD에 기능별 엔드포인트·배포 URL·Copilot SDK 경로·E2E 검증 시나리오를 모두 포함",
      })
    );
  }

  // ---- docs : 문서/의사결정 기록 ----
  checks.push(
    chk("README 실행 명령 존재(npm install/start)", has(readme, /npm\s+install/) && has(readme, /npm\s+(start|run)/) ? "PASS" : "WARN", {
      dim: "docs",
      weight: 2,
      evidence: `npm install: ${has(readme, /npm\s+install/)}, npm start/run: ${has(readme, /npm\s+(start|run)/)}`,
      fix: "README 에 실제 동작하는 실행 명령 기재",
    })
  );
  const adrCount = exists(P("docs/adr")) ? listFiles(P("docs/adr")).filter((f) => /\.md$/i.test(f)).length : 0;
  checks.push(
    chk("의사결정 기록(ADR) 존재", adrCount > 0 ? "PASS" : "WARN", {
      dim: "docs",
      evidence: `ADR ${adrCount}건`,
      fix: "핵심 결정을 docs/adr 에 기록",
    })
  );
  checks.push(
    chk("심사 브리프 존재", exists(P("docs/evaluation/AI_JUDGE_BRIEF.md")) ? "PASS" : "WARN", {
      dim: "docs",
      evidence: exists(P("docs/evaluation/AI_JUDGE_BRIEF.md")) ? "AI_JUDGE_BRIEF.md 존재" : "심사 브리프 미발견",
      fix: "docs/evaluation/AI_JUDGE_BRIEF.md 작성",
    })
  );
  checks.push(
    chk("Copilot instructions 존재", exists(P(".github/copilot-instructions.md")) ? "PASS" : "WARN", {
      dim: "docs",
      evidence: exists(P(".github/copilot-instructions.md")) ? "존재" : "미발견",
      fix: ".github/copilot-instructions.md 유지",
    })
  );

  return { id: "static-evidence", title: "정적 증거 스캔", checks };
}
