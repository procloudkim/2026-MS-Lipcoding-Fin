// judge/checks/05-ui-korean.mjs
// 프론트 정적 검사: 100% 한국어(G4) + Warm Editorial 디자인 토큰/상태 표현. (서버 불필요)
import path from "node:path";
import { chk, readText, exists } from "./_ctx.mjs";

const has = (t, re) => !!t && re.test(t);

// 프론트 산출물 위치는 프로젝트마다 다를 수 있어 후보 디렉터리를 순회한다.
function loadFrontend(repoRoot) {
  const dirs = ["public", "dist", "build", "web", "web/dist", "src", "."];
  let html = "", css = "", js = "";
  for (const d of dirs) {
    const base = path.join(repoRoot, d);
    if (!exists(base)) continue;
    html = html || readText(path.join(base, "index.html")) || "";
    css = css || readText(path.join(base, "styles.css")) || readText(path.join(base, "style.css")) || "";
    js = js || readText(path.join(base, "app.js")) || readText(path.join(base, "main.js")) || "";
  }
  return { html, css, js };
}

export default async function run(ctx) {
  const { repoRoot } = ctx;
  const { html, css, appjs } = (() => {
    const f = loadFrontend(repoRoot);
    return { html: f.html, css: f.css, appjs: f.js };
  })();
  const checks = [];

  // ---- G4 : 100% 한국어 UI ----
  const hangul = (html.match(/[\uAC00-\uD7A3]/g) || []).length;
  const langKo = /<html[^>]*lang=["']ko["']/i.test(html);
  checks.push(
    chk("한국어 UI(lang=ko + 한글 카피)", langKo && hangul >= 20 ? "PASS" : hangul >= 20 ? "WARN" : "FAIL", {
      gate: "G4",
      dim: "design",
      weight: 2,
      evidence: `lang=ko: ${langKo}, index.html 한글 ${hangul}자`,
      fix: langKo ? "한국어 카피 보강" : '<html lang="ko"> 설정 + UI 카피 한국어화',
    })
  );

  // ---- design : Warm Editorial 토큰/상태 ----
  checks.push(
    chk("Pretendard 폰트 적용", has(html, /Pretendard/i) || has(css, /Pretendard/i) ? "PASS" : "WARN", {
      dim: "design",
      evidence: has(html, /Pretendard/i) ? "Pretendard 링크/폰트 지정" : "Pretendard 미발견",
      fix: "Pretendard Variable 적용",
    })
  );
  // 단일 레드 액센트
  const accentDefined = /--accent\s*:/.test(css);
  const redHexes = [...new Set((css.match(/#[0-9a-fA-F]{6}/g) || []).filter((h) => {
    const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    return r >= 150 && g < 120 && b < 120; // 강한 레드 계열
  }))];
  checks.push(
    chk("단일 레드 액센트 절제 사용", accentDefined && redHexes.length <= 3 ? "PASS" : "WARN", {
      dim: "design",
      weight: 2,
      evidence: `--accent 정의: ${accentDefined}, 강한 레드 계열 ${redHexes.length}종 ${redHexes.join(",")}`,
      fix: "레드는 주요 액션/현재 상태/경고에만 사용(단일 액센트 유지)",
    })
  );
  checks.push(
    chk("베이지/잉크 팔레트 토큰", /--ink\s*:/.test(css) && /--bg|--surface|--paper/.test(css) ? "PASS" : "WARN", {
      dim: "design",
      evidence: `--ink: ${/--ink\s*:/.test(css)}, 배경 토큰: ${/--bg|--surface|--paper/.test(css)}`,
      fix: "베이지 배경 + 잉크 텍스트 토큰 정의",
    })
  );
  checks.push(
    chk("반응형(@media) 존재", /@media/.test(css) ? "PASS" : "WARN", {
      dim: "design",
      evidence: `@media 규칙 ${(css.match(/@media/g) || []).length}개`,
      fix: "375/768/1280/1920 기준 반응형 추가",
    })
  );

  // 상태 표현: loading / error / success
  const loading = has(appjs, /disabled\s*=\s*true/) || has(html, /spinner/);
  const error = has(css, /state--error/) || has(appjs, /실패|오류|에러/) || has(html, /실패|오류|에러/);
  const success = has(appjs, /render|amplify|decisions|timeline/i) || has(html, /amplify/);
  checks.push(
    chk("로딩 상태 표현", loading ? "PASS" : "WARN", { dim: "design", evidence: loading ? "spinner/disabled 처리" : "로딩 표현 미발견", fix: "요청 중 로딩 상태 표시" })
  );
  checks.push(
    chk("에러 상태 표현", error ? "PASS" : "WARN", { dim: "design", evidence: error ? "에러 상태/카피 존재" : "에러 표현 미발견", fix: "실패 시 사용자 안내 상태 추가" })
  );
  checks.push(
    chk("성공 렌더 표현", success ? "PASS" : "WARN", { dim: "design", evidence: success ? "결과 렌더 로직 존재" : "성공 렌더 미발견", fix: "결과 구조화 렌더 추가" })
  );

  // ---- honesty : UI source 배지(환경 분리) ----
  const badgeBranch = has(appjs, /copilot-sdk/) && has(appjs, /오프라인|fallback/i) && has(appjs, /setBadge|badge/i);
  checks.push(
    chk("UI source 배지로 환경 정직 표기", badgeBranch ? "PASS" : "WARN", {
      dim: "honesty",
      weight: 2,
      evidence: badgeBranch ? "copilot-sdk vs 오프라인 배지 분기 존재" : "source 배지 분기 미발견",
      fix: "응답 source 에 따라 배지를 다르게 표기(정직한 환경 분리)",
    })
  );

  return { id: "ui-korean", title: "프론트(한국어/디자인)", checks };
}
