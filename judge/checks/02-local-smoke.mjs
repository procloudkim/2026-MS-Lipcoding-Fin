// judge/checks/02-local-smoke.mjs
// 로컬 스모크(프로젝트 비종속): run-all 이 부팅한 server.js 에 실제 요청.
// 엔드포인트가 프로젝트마다 다르므로 server.js 에서 라우트를 발견해 핵심 액션을 검증한다.
// ctx.baseUrl 이 없으면(--skip-local 또는 부팅실패) G5 SKIP.
import path from "node:path";
import { chk, fetchJson, fetchText, readText, discoverRoutes, sampleBody } from "./_ctx.mjs";

export default async function run(ctx) {
  const { baseUrl, repoRoot } = ctx;
  if (!baseUrl) {
    return {
      id: "local-smoke",
      title: "로컬 스모크",
      checks: [
        chk("로컬 서버 부팅", "SKIP", { gate: "G5", evidence: "--local 미지정 또는 부팅 실패로 건너뜀", fix: "node judge/checks/run-all.mjs --local 로 실행" }),
      ],
    };
  }

  const checks = [];
  const server = readText(path.join(repoRoot, "server.js")) || "";
  const { posts } = discoverRoutes(server);
  const actionRoutes = posts.filter((r) => !/health|_diag|debug|metrics/i.test(r)).slice(0, 5);

  // 헬스 (G5)
  const health = await fetchJson(`${baseUrl}/api/health`, {}, 4000);
  const healthOk = health.ok && health.json?.ok === true;
  checks.push(
    chk("GET /api/health → ok:true", healthOk ? "PASS" : "WARN", {
      gate: "G5",
      dim: "verification",
      evidence: health.json ? JSON.stringify(health.json) : health.error || `status ${health.status}`,
      fix: "health 라우트가 { ok: true } 를 반환하도록 점검",
    })
  );

  // 메인 페이지 로드
  const home = await fetchText(`${baseUrl}/`, {}, 6000);
  const hangul = (home.text.match(/[\uAC00-\uD7A3]/g) || []).length;
  checks.push(
    chk("GET / → 200 (앱 렌더)", home.status === 200 ? "PASS" : "WARN", {
      gate: "G5",
      dim: "verification",
      evidence: home.status === 200 ? `200, 한글 ${hangul}자, len=${home.text.length}` : home.error || `status ${home.status}`,
      fix: "정적 프론트(index.html) 서빙 점검",
    })
  );

  // 핵심 액션: 발견된 POST 라우트에 일반 본문을 보내 응답을 본다.
  // 200(성공) 우선, 그다음 4xx(서버 살아있음/검증 동작)도 'alive' 로 간주.
  let any200 = null;
  let anyAlive = null;
  let any5xx = null;
  const tried = [];
  for (const r of actionRoutes) {
    const res = await fetchJson(`${baseUrl}${r}`, { method: "POST", body: sampleBody() }, 30000);
    tried.push(`${r}:${res.status || res.error}`);
    if (res.status === 200 && !any200) any200 = { route: r, res };
    if ([200, 201, 400, 401, 403, 422].includes(res.status) && !anyAlive) anyAlive = { route: r, res };
    if (res.status >= 500 && !any5xx) any5xx = { route: r, res };
    if (any200) break;
  }

  if (actionRoutes.length === 0) {
    checks.push(
      chk("핵심 POST 액션 동작", "WARN", {
        gate: "G5",
        dim: "verification",
        weight: 2,
        evidence: `server.js 에서 핵심 POST 라우트를 찾지 못함(발견 POST: ${posts.join(", ") || "없음"})`,
        fix: "사용자 액션을 처리하는 POST 라우트가 있는지 확인",
      })
    );
  } else if (any200) {
    const j = any200.res.json || {};
    checks.push(
      chk("핵심 POST 액션 → 200", "PASS", {
        gate: "G5",
        dim: "verification",
        weight: 2,
        evidence: `${any200.route} → 200${j.source ? `, source=${j.source}` : ""}`,
        fix: "",
      })
    );
    if (j.source) {
      checks.push(chk("응답 source 표기(정직성)", "PASS", { dim: "honesty", evidence: `${any200.route} source=${j.source}${j.notice ? ` / ${j.notice}` : ""}`, fix: "" }));
    }
  } else if (anyAlive) {
    checks.push(
      chk("핵심 POST 액션 동작", "WARN", {
        gate: "G5",
        dim: "verification",
        weight: 2,
        evidence: `200 미확인이나 서버 응답함(검증/인증 동작): ${tried.join(", ")}`,
        fix: "샘플 본문으로 200 을 받도록 입력 스키마/필수값 확인(심사 시 정상 입력으로 재현)",
      })
    );
  } else {
    checks.push(
      chk("핵심 POST 액션 동작", "FAIL", {
        gate: "G5",
        dim: "verification",
        weight: 2,
        evidence: any5xx ? `${any5xx.route} → ${any5xx.res.status} (서버 오류)` : `응답 없음: ${tried.join(", ")}`,
        fix: "핵심 POST 라우트가 5xx 없이 응답하도록 수정(필요 시 fallback 200)",
      })
    );
  }

  // 입력 검증: 빈 본문 → 4xx 기대
  if (actionRoutes.length > 0) {
    const empty = await fetchJson(`${baseUrl}${actionRoutes[0]}`, { method: "POST", body: {} }, 8000);
    checks.push(
      chk("빈 입력 검증", empty.status >= 400 && empty.status < 500 ? "PASS" : "WARN", {
        dim: "engineering",
        evidence: `${actionRoutes[0]} 빈 본문 → ${empty.status}${empty.json?.error ? ` ${empty.json.error}` : ""}`,
        fix: "빈/잘못된 입력은 4xx 로 거절하고 안내 메시지 반환",
      })
    );
  }

  return { id: "local-smoke", title: "로컬 스모크", checks };
}
