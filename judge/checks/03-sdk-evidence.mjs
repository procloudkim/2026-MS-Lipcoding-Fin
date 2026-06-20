// judge/checks/03-sdk-evidence.mjs
// Copilot SDK 통합 깊이: 코드경로가 실제 워크플로우에 연결됐는지 + 라이브 응답 source 분류.
// 라이브 source 는 환경(런타임/인증) 의존이므로 fallback 이어도 게이트 FAIL 이 아니라 WARN/증거.
import path from "node:path";
import { chk, readText, fetchJson, discoverRoutes, sampleBody } from "./_ctx.mjs";

export default async function run(ctx) {
  const { repoRoot, baseUrl, health } = ctx;
  const checks = [];
  const server = readText(path.join(repoRoot, "server.js")) || "";

  // SDK 호출이 실제 워크플로우에 연결됐는지 (프로젝트마다 함수명이 다르므로 일반화)
  const sdkCalls = (server.match(/session\.send\s*\(/g) || []).length;
  const promptPassed = /send\(\s*\{[\s\S]{0,60}prompt/.test(server) || /\bprompt\b/.test(server);
  const asyncHandlers = (server.match(/app\.(?:get|post|put|delete)\([^]*?async\s*\(/g) || []).length
    || (server.match(/async\s*\(\s*req/g) || []).length;
  const connected = sdkCalls >= 1 && promptPassed && asyncHandlers >= 1;
  checks.push(
    chk("SDK 호출이 실제 워크플로우에 연결", connected ? "PASS" : "FAIL", {
      gate: "G2",
      dim: "sdk-depth",
      weight: 2,
      evidence: `session.send 호출 ${sdkCalls}회, prompt 전달 ${promptPassed}, async 라우트 핸들러 ${asyncHandlers}개 (가짜 UI 카피가 아닌 실제 호출)`,
      fix: "SDK 세션 호출(session.send)을 사용자 액션 라우트 핸들러에 직접 연결하고 prompt 를 전달",
    })
  );
  checks.push(
    chk("권한 처리(onPermissionRequest/approveAll)", /onPermissionRequest|approveAll/.test(server) ? "PASS" : "WARN", {
      dim: "sdk-depth",
      evidence: /approveAll/.test(server) ? "approveAll 사용" : "권한 콜백 미발견",
      fix: "createSession 에 onPermissionRequest 처리 추가",
    })
  );
  checks.push(
    chk("응답 타임아웃 가드", /withTimeout|SDK_TIMEOUT_MS|setTimeout/.test(server) ? "PASS" : "WARN", {
      dim: "sdk-depth",
      evidence: /SDK_TIMEOUT_MS/.test(server) ? "SDK_TIMEOUT_MS 가드 존재" : "타임아웃 가드 약함",
      fix: "SDK 응답에 타임아웃을 두어 무한 대기 방지",
    })
  );

  // 라이브 분류
  if (!baseUrl) {
    checks.push(
      chk("라이브 SDK 응답 source 분류", "SKIP", {
        dim: "sdk-depth",
        evidence: "로컬 서버 미부팅(--skip-local) → 라이브 분류 생략",
        fix: "node judge/checks/run-all.mjs --local 로 라이브 분류 실행",
      })
    );
  } else {
    if (health?.authMode) {
      checks.push(
        chk("인증 모드 표기", "PASS", { dim: "sdk-depth", evidence: `authMode=${health.authMode}`, fix: "" })
      );
    }
    // SDK-backed 라우트를 발견해(서버 코드에 source:"copilot-sdk" 반환) 라이브 호출.
    const { posts } = discoverRoutes(server);
    const sdkRoutes = posts.filter((r) => !/health|_diag|debug|metrics/i.test(r));
    let r = { json: null, status: 0, error: "no POST route" };
    let usedRoute = null;
    for (const route of sdkRoutes.slice(0, 5)) {
      const res = await fetchJson(`${baseUrl}${route}`, { method: "POST", body: sampleBody() }, 30000);
      usedRoute = route;
      if (res.json && res.json.source) {
        r = res;
        break;
      }
      if (res.status === 200 && !r.json) r = res;
    }
    const source = r.json?.source;
    if (source === "copilot-sdk") {
      checks.push(
        chk("라이브 SDK 응답 실증(source=copilot-sdk)", "PASS", {
          dim: "sdk-depth",
          weight: 3,
          evidence: `${usedRoute} → 실제 모델 응답 수신. model=${r.json?.model}`,
          fix: "",
        })
      );
    } else if (source === "fallback") {
      checks.push(
        chk("라이브 SDK 응답 실증(source=copilot-sdk)", "WARN", {
          dim: "sdk-depth",
          weight: 3,
          evidence: `현재 환경에서 fallback 응답(런타임/인증 미보장). ${usedRoute} detail=${(r.json?.detail || "").slice(0, 140)}`,
          fix: "로컬에서 COPILOT_CLI_PATH/로그인 설정 후 source=copilot-sdk 재현 → SDK 실증 강화",
        })
      );
    } else {
      checks.push(
        chk("라이브 SDK 응답 실증(source=copilot-sdk)", "WARN", {
          dim: "sdk-depth",
          weight: 3,
          evidence: r.error || `source 필드 미확인(${usedRoute || "라우트 없음"}, status=${r.status}). 표준 source 표기 권장`,
          fix: "SDK-backed 응답에 source: 'copilot-sdk'|'fallback' 필드를 포함해 정직하게 표기",
        })
      );
    }
  }

  return { id: "sdk-evidence", title: "Copilot SDK 증거", checks };
}
