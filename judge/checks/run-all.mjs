// judge/checks/run-all.mjs
// 립코딩 심사 오케스트레이터: 체크 모듈 실행 → 게이트/가중점수 집계 → reports 출력.
//
// 사용:
//   node judge/checks/run-all.mjs                          # 현재 repo, 로컬 스모크 포함
//   node judge/checks/run-all.mjs --target <projectDir>    # 다른 프로젝트 폴더 평가
//   node judge/checks/run-all.mjs --azure-url <URL>        # 로컬 + Azure 공개 URL
//   node judge/checks/run-all.mjs --skip-local             # 정적/프론트/보안만(서버 부팅 X)
//   node judge/checks/run-all.mjs --audit                  # npm audit 포함(온라인 필요)
//   옵션: --port <n> (기본 4123) · --out <dir> · --quiet
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chk, startServer } from "./_ctx.mjs";
import staticEvidence from "./01-static-evidence.mjs";
import localSmoke from "./02-local-smoke.mjs";
import sdkEvidence from "./03-sdk-evidence.mjs";
import azureSmoke from "./04-azure-smoke.mjs";
import uiKorean from "./05-ui-korean.mjs";
import security from "./06-security.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// judgeRoot = judge/ 도구가 설치된 repo (rubric/weights 위치). repoRoot = 실제 평가 대상.
const judgeRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const a = { local: true, azureUrl: null, target: null, audit: false, port: 4123, out: null, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--skip-local") a.local = false;
    else if (t === "--local") a.local = true;
    else if (t === "--quiet") a.quiet = true;
    else if (t === "--audit") a.audit = true;
    else if (t === "--target") a.target = argv[++i] || null;
    else if (t === "--azure-url") a.azureUrl = argv[++i] || null;
    else if (t === "--port") a.port = Number(argv[++i]) || a.port;
    else if (t === "--out") a.out = path.resolve(argv[++i] || a.out);
  }
  a.out = a.out || path.join(judgeRoot, "judge", "reports");
  return a;
}

const STATUS_VALUE = { PASS: 1, WARN: 0.5, FAIL: 0 };
const ICON = { PASS: "✅", FAIL: "❌", WARN: "⚠️", SKIP: "⏭️" };
const SEV_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
const SEV_ICON = { critical: "🟥", high: "🟧", medium: "🟨", low: "🟦", info: "⬜" };
const DEFAULT_SEC = { grade: { critical: "D", high: "C", medium: "B", low: "A", clean: "A+" } };

async function runModule(fn, ctx, id, title) {
  try {
    const r = await fn(ctx);
    return r && Array.isArray(r.checks) ? r : { id, title, checks: [] };
  } catch (err) {
    return { id, title, checks: [chk(`${title} 실행 오류`, "FAIL", { evidence: String(err?.stack || err).slice(0, 300), fix: "체크 모듈 예외 수정" })] };
  }
}

function aggregate(weights, sections) {
  const all = [];
  for (const s of sections) for (const c of s.checks) all.push({ section: s.id, ...c });

  // 게이트
  const gates = weights.gates.map((g) => {
    const cs = all.filter((c) => c.gate === g.id);
    let status = "SKIP";
    if (cs.some((c) => c.status === "FAIL")) status = "FAIL";
    else if (cs.some((c) => c.status === "PASS" || c.status === "WARN")) status = "PASS";
    return { ...g, status, checks: cs };
  });

  // 차원 점수
  const dims = weights.dimensions.map((d) => {
    const cs = all.filter((c) => c.dim === d.id && c.status !== "SKIP");
    const wsum = cs.reduce((a, c) => a + (c.weight || 1), 0);
    const vsum = cs.reduce((a, c) => a + (c.weight || 1) * (STATUS_VALUE[c.status] ?? 0), 0);
    const ratio = wsum > 0 ? vsum / wsum : null;
    return { ...d, ratio, score: ratio == null ? null : Math.round(ratio * d.weight * 10) / 10, count: cs.length };
  });

  const scored = dims.filter((d) => d.ratio != null);
  const wTotal = scored.reduce((a, d) => a + d.weight, 0);
  const total = wTotal > 0 ? Math.round((scored.reduce((a, d) => a + d.ratio * d.weight, 0) / wTotal) * 1000) / 10 : 0;

  const failedGates = gates.filter((g) => g.status === "FAIL").map((g) => g.id);
  const skippedGates = gates.filter((g) => g.status === "SKIP").map((g) => g.id);
  const anyGateFail = failedGates.length > 0;
  const anyGateSkip = skippedGates.length > 0;
  const { ready, conditional } = weights.verdictThresholds;
  let verdict, reason;
  if (anyGateFail) {
    verdict = "BLOCK";
    reason = `P0 게이트 미충족: ${failedGates.join(", ")}`;
  } else if (anyGateSkip) {
    verdict = "CONDITIONAL";
    reason = `미검증 게이트: ${skippedGates.join(", ")} (해당 검증 경로 미실행)`;
  } else if (total >= ready) {
    verdict = "READY";
    reason = `전 게이트 통과 + 총점 ${total} ≥ ${ready}`;
  } else if (total >= conditional) {
    verdict = "CONDITIONAL";
    reason = `게이트 통과하나 총점 ${total} < ${ready}`;
  } else {
    verdict = "CONDITIONAL";
    reason = `게이트 통과하나 총점 ${total} 낮음`;
  }

  const fixes = all
    .filter((c) => (c.status === "FAIL" || c.status === "WARN") && c.fix && !c.sec)
    .map((c) => ({ pri: c.status === "FAIL" ? 1 : 2, gate: c.gate, dim: c.dim, name: c.name, fix: c.fix, evidence: c.evidence }))
    .sort((a, b) => a.pri - b.pri);

  // 보안 advisory (100점 제품 점수와 분리). sec 태그가 있는 체크만.
  const advisory = all.filter((c) => c.sec != null);
  const findings = advisory.filter((c) => c.status === "FAIL" || c.status === "WARN");
  const worstRank = findings.reduce((m, c) => Math.max(m, SEV_RANK[c.sec] || 0), 0);
  const gradeMap = (weights.security && weights.security.grade) || DEFAULT_SEC.grade;
  const worstSev = Object.keys(SEV_RANK).find((k) => SEV_RANK[k] === worstRank) || "info";
  const secGrade = worstRank === 0 ? gradeMap.clean : gradeMap[worstSev];
  const sevCounts = findings.reduce((m, c) => ((m[c.sec] = (m[c.sec] || 0) + 1), m), {});
  const secVerdict =
    secGrade === "D" ? "배포 보류 권고(critical)"
    : secGrade === "C" ? "배포 전 수정 권고(high)"
    : secGrade === "B" ? "개선 권장(medium)"
    : "양호";
  const security = { advisory, findings, grade: secGrade, worstSev, sevCounts, verdict: secVerdict };

  const counts = all.reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
  return { all, gates, dims, total, verdict, reason, fixes, counts, anyGateFail, security };
}

function toMarkdown(meta, agg) {
  const L = [];
  L.push(`# 립코딩 심사 리포트 — ${meta.appName}`);
  L.push("");
  L.push(`- 대회: ${meta.contest}`);
  L.push(`- 일시: ${meta.timestamp}`);
  L.push(`- 평가자: judge/checks/run-all.mjs (자동 증거 수집)`);
  L.push(`- 대상 경로: ${meta.targetPath}`);
  L.push(`- 검증 범위: 로컬=${meta.local ? "포함" : "생략"}, Azure=${meta.azureUrl || "미지정"}, npm audit=${meta.audit ? "포함" : "생략"}`);
  L.push("");
  L.push(`## 한 줄 평결: ${ICON[agg.verdict] || ""} **${agg.verdict}** · 총점 ${agg.total}/100 · 보안등급 ${agg.security.grade}`);
  L.push(`> ${agg.reason} · 체크 ${Object.entries(agg.counts).map(([k, v]) => `${k} ${v}`).join(" / ")}`);
  L.push("");
  L.push(`## 🔒 보안 advisory — 등급 ${agg.security.grade} (${agg.security.verdict})`);
  L.push(`> 제품 점수(100점)와 분리된 배포 전 보안 점검. 발견 ${agg.security.findings.length}건` +
    (Object.keys(agg.security.sevCounts).length ? ` (${Object.entries(agg.security.sevCounts).map(([k, v]) => `${SEV_ICON[k] || ""}${k} ${v}`).join(", ")})` : ""));
  if (agg.security.findings.length) {
    L.push("");
    L.push("| 심각도 | 항목 | 근거 | 수정 |");
    L.push("| --- | --- | --- | --- |");
    const ord = agg.security.findings.slice().sort((a, b) => (SEV_RANK[b.sec] || 0) - (SEV_RANK[a.sec] || 0));
    for (const c of ord) {
      L.push(`| ${SEV_ICON[c.sec] || ""} ${c.sec} | ${c.name}${c.gate ? ` _(${c.gate})_` : ""} | ${(c.evidence || "-").slice(0, 170)} | ${(c.fix || "-").slice(0, 130)} |`);
    }
  } else {
    L.push("> 발견된 보안 이슈 없음.");
  }
  L.push("");
  L.push("## P0 게이트");
  L.push("| 게이트 | 항목 | 상태 | 근거 |");
  L.push("| --- | --- | --- | --- |");
  for (const g of agg.gates) {
    const ev = g.checks.map((c) => c.evidence).filter(Boolean).join(" / ").slice(0, 160) || "-";
    L.push(`| ${g.id} | ${g.title} | ${ICON[g.status]} ${g.status} | ${ev} |`);
  }
  L.push("");
  L.push("## 점수 차원");
  L.push("| 차원 | 가중치 | 점수 | 체크수 |");
  L.push("| --- | --- | --- | --- |");
  for (const d of agg.dims) L.push(`| ${d.title} | ${d.weight} | ${d.score == null ? "N/A" : `${d.score}/${d.weight}`} | ${d.count} |`);
  L.push(`| **합계** | **100** | **${agg.total}/100** | ${agg.all.length} |`);
  L.push("");
  L.push("## 섹션별 상세");
  const bySection = {};
  for (const c of agg.all) if (c.section !== "security") (bySection[c.section] ||= []).push(c);
  for (const [sid, cs] of Object.entries(bySection)) {
    L.push(`### ${sid}`);
    L.push("| 체크 | 상태 | 근거 | 수정 |");
    L.push("| --- | --- | --- | --- |");
    for (const c of cs) {
      const tag = [c.gate, c.dim].filter(Boolean).join("·");
      L.push(`| ${c.name}${tag ? ` _(${tag})_` : ""} | ${ICON[c.status]} ${c.status} | ${(c.evidence || "-").slice(0, 180)} | ${(c.fix || "-").slice(0, 120)} |`);
    }
    L.push("");
  }
  if (agg.fixes.length) {
    L.push("## 다음 최소 수정 우선순위");
    let i = 1;
    for (const f of agg.fixes) L.push(`${i++}. ${f.pri === 1 ? "[P0]" : "[개선]"} ${f.name} — ${f.fix}`);
    L.push("");
  }
  L.push("## 심사위원 코멘트");
  L.push(`- 자동 평결: ${agg.verdict} (${agg.reason}).`);
  L.push("- 정성 판단(생산성 가치/디자인 완성도/정직성)은 judge/agent/lipcoding-judge.md 프로토콜로 보강하세요.");
  L.push("");
  return L.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = args.target ? path.resolve(args.target) : judgeRoot;
  const weights = JSON.parse(fs.readFileSync(path.join(judgeRoot, "judge", "rubric", "weights.json"), "utf8"));
  const log = (...m) => !args.quiet && console.log(...m);

  if (!fs.existsSync(repoRoot)) {
    console.error(`[judge] 대상 경로 없음: ${repoRoot}`);
    process.exit(2);
  }

  let pkgName = path.basename(repoRoot);
  try {
    pkgName = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).name || pkgName;
  } catch {}

  const ctx = { repoRoot, judgeRoot, baseUrl: null, azureUrl: args.azureUrl, audit: args.audit, health: null };
  const sections = [];

  log(`\n[judge] 평가 대상: ${repoRoot}${args.target ? " (--target)" : ""}`);
  log(`[judge] 정적/프론트 검사…`);
  sections.push(await runModule(staticEvidence, ctx, "static-evidence", "정적 증거 스캔"));
  sections.push(await runModule(uiKorean, ctx, "ui-korean", "프론트(한국어/디자인)"));
  log(`[judge] 보안 advisory…${args.audit ? " (npm audit 포함)" : ""}`);
  sections.push(await runModule(security, ctx, "security", "보안 advisory"));

  let server = null;
  if (args.local) {
    log(`[judge] 로컬 서버 부팅(port ${args.port})…`);
    server = await startServer({ repoRoot, port: args.port });
    if (server.ok) {
      ctx.baseUrl = server.baseUrl;
      ctx.health = server.health;
      log(`[judge]   부팅 OK (${server.baseUrl}, authMode=${server.health?.authMode})`);
    } else {
      log(`[judge]   부팅 실패: ${server.error}`);
      sections.push({
        id: "local-boot",
        title: "로컬 부팅",
        checks: [chk("로컬 서버 부팅", "FAIL", { gate: "G5", evidence: `${server.error} | ${String(server.logs?.() || "").slice(-200)}`, fix: "npm install 후 node server.js 가 기동되는지 확인" })],
      });
    }
  }

  log(`[judge] 로컬 스모크…`);
  sections.push(await runModule(localSmoke, ctx, "local-smoke", "로컬 스모크"));
  log(`[judge] SDK 증거…`);
  sections.push(await runModule(sdkEvidence, ctx, "sdk-evidence", "Copilot SDK 증거"));

  if (server?.ok) await server.stop();

  if (args.azureUrl) log(`[judge] Azure 스모크: ${args.azureUrl}`);
  sections.push(await runModule(azureSmoke, ctx, "azure-smoke", "Azure 공개 URL 스모크"));

  const agg = aggregate(weights, sections);
  const ts = new Date();
  const meta = { appName: pkgName, targetPath: repoRoot, contest: weights.contest, timestamp: ts.toISOString(), local: args.local, azureUrl: args.azureUrl, audit: args.audit };

  fs.mkdirSync(args.out, { recursive: true });
  const stamp = ts.toISOString().replace(/[:.]/g, "-");
  const slug = String(pkgName).replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "app";
  const md = toMarkdown(meta, agg);
  const json = JSON.stringify({ meta, weights: { gates: weights.gates, dimensions: weights.dimensions }, gates: agg.gates, dims: agg.dims, total: agg.total, verdict: agg.verdict, reason: agg.reason, security: { grade: agg.security.grade, worstSev: agg.security.worstSev, sevCounts: agg.security.sevCounts, verdict: agg.security.verdict, findings: agg.security.findings }, counts: agg.counts, fixes: agg.fixes, sections }, null, 2);
  fs.writeFileSync(path.join(args.out, `judge-report-${slug}-${stamp}.md`), md);
  fs.writeFileSync(path.join(args.out, `judge-report-${slug}-${stamp}.json`), json);
  fs.writeFileSync(path.join(args.out, `latest-${slug}.md`), md);
  fs.writeFileSync(path.join(args.out, `latest-${slug}.json`), json);
  fs.writeFileSync(path.join(args.out, `latest.md`), md);
  fs.writeFileSync(path.join(args.out, `latest.json`), json);

  // 콘솔 요약
  log("");
  log(`================ 립코딩 심사 결과 ================`);
  log(` 대상: ${pkgName}`);
  log(` 평결: ${ICON[agg.verdict] || ""} ${agg.verdict}  ·  총점 ${agg.total}/100`);
  log(` 보안: 등급 ${agg.security.grade} (${agg.security.verdict})  ·  발견 ${agg.security.findings.length}건`);
  log(` 사유: ${agg.reason}`);
  log(` 게이트: ${agg.gates.map((g) => `${g.id}:${g.status}`).join("  ")}`);
  log(` 체크: ${Object.entries(agg.counts).map(([k, v]) => `${ICON[k]}${v}`).join("  ")}`);
  log(` 리포트: ${path.join(args.out, `judge-report-${slug}-${stamp}.md`)}`);
  log(`================================================`);
  if (agg.security.findings.length) {
    const top = agg.security.findings.slice().sort((a, b) => (SEV_RANK[b.sec] || 0) - (SEV_RANK[a.sec] || 0)).slice(0, 5);
    log(` 보안 발견(상위 ${top.length}):`);
    top.forEach((f, i) => log(`   ${i + 1}. [${f.sec}] ${f.name} — ${f.fix}`));
  }
  if (agg.fixes.length) {
    log(` 다음 최소 수정(상위 ${Math.min(5, agg.fixes.length)}):`);
    agg.fixes.slice(0, 5).forEach((f, i) => log(`   ${i + 1}. ${f.pri === 1 ? "[P0]" : "[개선]"} ${f.name} — ${f.fix}`));
  }
  log("");

  process.exit(agg.anyGateFail ? 1 : 0);
}

main().catch((e) => {
  console.error("[judge] 치명적 오류:", e);
  process.exit(2);
});
