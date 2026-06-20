// judge/checks/04-azure-smoke.mjs
// Azure 공개 URL 스모크. ctx.azureUrl 없으면 게이트 SKIP(→ CONDITIONAL).
import path from "node:path";
import { chk, fetchJson, fetchText, readText, discoverRoutes, sampleBody } from "./_ctx.mjs";

export default async function run(ctx) {
  const azureUrl = ctx.azureUrl ? ctx.azureUrl.replace(/\/+$/, "") : null;
  if (!azureUrl) {
    return {
      id: "azure-smoke",
      title: "Azure 공개 URL 스모크",
      checks: [
        chk("Azure 배포 + public URL", "SKIP", {
          gate: "G3",
          dim: "verification",
          evidence: "--azure-url 미지정 → 공개 URL 검증 생략(CONDITIONAL)",
          fix: "node judge/checks/run-all.mjs --local --azure-url https://<app>.azurewebsites.net",
        }),
      ],
    };
  }

  const checks = [];

  // GET / → 200 + 한국어
  const home = await fetchText(`${azureUrl}/`, {}, 12000);
  const hangul = (home.text.match(/[\uAC00-\uD7A3]/g) || []).length;
  const homeOk = home.status === 200 && hangul >= 10;
  checks.push(
    chk("GET / → 200 (한국어 앱 렌더)", homeOk ? "PASS" : "FAIL", {
      gate: "G3",
      dim: "verification",
      weight: 2,
      evidence: homeOk ? `200, 한글 ${hangul}자, len=${home.text.length}` : home.error || `status ${home.status}, 한글 ${hangul}자`,
      fix: "Azure App Service 배포/시작 명령/포트 확인 후 공개 URL 재검증",
    })
  );

  // health
  const health = await fetchJson(`${azureUrl}/api/health`, {}, 10000);
  checks.push(
    chk("GET /api/health → ok:true", health.ok && health.json?.ok === true ? "PASS" : "WARN", {
      dim: "verification",
      evidence: health.json ? JSON.stringify(health.json) : health.error || `status ${health.status}`,
      fix: "배포 인스턴스의 health 라우트/기동 로그 확인",
    })
  );

  // primary action (배포 환경은 보통 fallback) — 라우트는 프로젝트별로 발견
  const server = readText(path.join(ctx.repoRoot, "server.js")) || "";
  const { posts } = discoverRoutes(server);
  const actionRoutes = posts.filter((r) => !/health|_diag|debug|metrics/i.test(r)).slice(0, 5);
  let hit = { route: null, status: 0, json: null, error: "no POST route" };
  for (const r of actionRoutes) {
    const res = await fetchJson(`${azureUrl}${r}`, { method: "POST", body: sampleBody() }, 30000);
    if (res.status === 200) {
      hit = { route: r, ...res };
      break;
    }
    if (!hit.route) hit = { route: r, ...res };
  }
  const planOk = hit.status === 200;
  checks.push(
    chk("핵심 POST 액션 → 200 (배포 환경)", planOk ? "PASS" : "FAIL", {
      gate: "G3",
      dim: "verification",
      weight: 2,
      evidence: planOk ? `${hit.route} → 200${hit.json?.source ? `, source=${hit.json.source}` : ""}` : hit.error || `${hit.route} status ${hit.status}`,
      fix: "배포 환경에서 핵심 라우트가 5xx 없이 응답하도록(필요 시 fallback 200) 보장",
    })
  );
  if (planOk && hit.json?.source) {
    checks.push(
      chk("배포 환경 source 정직 표기", "PASS", {
        dim: "honesty",
        evidence: `source=${hit.json.source}${hit.json.notice ? ` / ${hit.json.notice}` : ""}`,
        fix: "",
      })
    );
  }

  return { id: "azure-smoke", title: "Azure 공개 URL 스모크", checks };
}
