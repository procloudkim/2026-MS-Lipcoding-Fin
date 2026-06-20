// judge/checks/06-security.mjs
// 배포 전 보안 advisory. 100점 제품 점수와 분리되어 "보안 등급"으로 별도 보고된다.
// 검사: 노출된 진단/디버그 엔드포인트, 에러 원문 유출, 보안 헤더/CORS, SDK 자동권한,
//       본문 크기 제한, 하드코딩 시크릿(→G6), .npmrc 토큰, 커밋 아카이브,
//       git 추적 시크릿, npm audit(best-effort).
import path from "node:path";
import { chk, readText, exists, listFiles, runCmd } from "./_ctx.mjs";

const has = (t, re) => !!t && re.test(t);
// 보안 체크: 기본 PASS, 문제 발견 시 status + severity(sec) 부여.
const sec = (name, status, severity, evidence, fix, extra = {}) =>
  chk(name, status, { evidence, fix, sec: status === "PASS" ? "info" : severity, ...extra });

export default async function run(ctx) {
  const { repoRoot, audit = false } = ctx;
  const P = (f) => path.join(repoRoot, f);
  const server = readText(P("server.js")) || "";
  const lib = (readText(P("lib.js")) || "") + (readText(P("lib-github.js")) || "");
  const code = server + "\n" + lib;
  const checks = [];

  // 1) 노출된 진단/디버그 엔드포인트 (정보유출)
  const diagRoutes = [...server.matchAll(/app\.(?:get|post)\(\s*["'](\/api\/(?:_diag|diag|debug|__[a-z]+|admin)[A-Za-z0-9_\-/]*)["']/gi)].map((m) => m[1]);
  const leaksFs = has(server, /readdirSync|process\.cwd\(\)|__dirname|process\.env\b/) && diagRoutes.length > 0;
  if (diagRoutes.length > 0) {
    const weakKey = has(server, /req\.query\.key|===\s*["'][a-z0-9]+["']/i);
    checks.push(
      sec(
        "진단/디버그 엔드포인트 노출",
        "WARN",
        leaksFs ? "high" : "medium",
        `라우트 ${diagRoutes.join(", ")}${leaksFs ? " — fs 경로/디렉터리/env 노출 가능" : ""}${weakKey ? " (정적 쿼리 키 가드)" : " (무가드)"}`,
        "배포 빌드에서 제거하거나 강한 인증/환경변수 토큰으로 보호하고 응답에서 fs/env 정보를 제거"
      )
    );
  } else {
    checks.push(sec("진단/디버그 엔드포인트 노출", "PASS", "info", "노출형 진단 라우트 미발견", ""));
  }

  // 2) 에러 원문(detail) 클라이언트 유출
  const errLeak = has(server, /detail:\s*String\(\s*err|message:\s*err\.message|res\.(?:json|send)\([^)]*err(?:\.message|\.stack)/);
  checks.push(
    errLeak
      ? sec("에러 원문 클라이언트 유출", "WARN", "medium", "catch 블록이 err.message/detail 을 응답에 포함 → 내부 구조/경로 유출 가능", "사용자 메시지는 일반화하고 상세는 서버 로그로만 남기기")
      : sec("에러 원문 클라이언트 유출", "PASS", "info", "응답에 에러 원문 노출 미발견", "")
  );

  // 3) 보안 헤더(helmet)
  const helmet = has(code, /helmet/);
  checks.push(
    helmet
      ? sec("보안 헤더(helmet)", "PASS", "info", "helmet 적용", "")
      : sec("보안 헤더(helmet) 부재", "WARN", "low", "helmet 등 보안 헤더 미들웨어 미발견", "helmet 추가(X-Frame-Options, CSP, HSTS 등)")
  );

  // 4) CORS 설정
  const corsWildcard = has(code, /Access-Control-Allow-Origin["']\s*,\s*["']\*|cors\(\s*\)/);
  const corsScoped = has(code, /cors\(\s*\{/);
  if (corsWildcard && !corsScoped) {
    checks.push(sec("CORS 와일드카드", "WARN", "medium", "모든 출처 허용(cors() 또는 ACAO:*)", "허용 출처를 명시적으로 제한"));
  } else {
    checks.push(sec("CORS 설정", "PASS", "info", corsScoped ? "출처 제한 CORS" : "교차출처 개방 미발견(동일출처)", ""));
  }

  // 5) SDK 자동 권한 승인
  checks.push(
    has(server, /approveAll/)
      ? sec("SDK 자동 권한 승인(approveAll)", "WARN", "low", "onPermissionRequest: approveAll — 모든 도구 권한 자동 승인", "프롬프트 주입 위험을 고려해 권한 범위를 제한하거나 신뢰 입력에만 사용")
      : sec("SDK 권한 처리", "PASS", "info", "approveAll 미사용", "")
  );

  // 6) 본문 크기 제한 (DoS)
  const jsonLimited = has(server, /express\.json\(\s*\{[^}]*limit/);
  const jsonUnlimited = has(server, /express\.json\(\s*\)/);
  if (jsonLimited) checks.push(sec("요청 본문 크기 제한", "PASS", "info", "express.json limit 설정", ""));
  else if (jsonUnlimited) checks.push(sec("요청 본문 크기 제한 부재", "WARN", "low", "express.json() limit 미설정 → 대용량 본문 허용", "express.json({ limit: '256kb' }) 처럼 제한"));
  else checks.push(sec("요청 본문 크기 제한", "PASS", "info", "JSON 본문 파서 미사용/해당 없음", ""));

  // 7) 하드코딩 시크릿 (→ G6 게이트에도 반영)
  const hardSecret = [
    { n: "GitHub token", re: /["'](?:ghp_|github_pat_|gho_|ghs_)[A-Za-z0-9_]{20,}["']/ },
    { n: "OpenAI key", re: /["']sk-[A-Za-z0-9]{20,}["']/ },
    { n: "AWS key", re: /["']AKIA[0-9A-Z]{16}["']/ },
    { n: "Slack token", re: /["']xox[baprs]-[A-Za-z0-9-]{10,}["']/ },
  ].filter((p) => p.re.test(code)).map((p) => p.n);
  checks.push(
    hardSecret.length === 0
      ? sec("코드 내 하드코딩 시크릿", "PASS", "info", "server.js/lib 에 토큰 리터럴 미발견", "")
      : chk("코드 내 하드코딩 시크릿", "FAIL", { gate: "G6", sec: "critical", evidence: `하드코딩 의심: ${hardSecret.join(", ")}`, fix: "리터럴 제거 → env 로 이동, 노출 토큰 즉시 회수(rotate)" })
  );

  // 8) .npmrc 인증 토큰
  const npmrc = readText(P(".npmrc"));
  if (npmrc && /_authToken|_password|:_auth=/.test(npmrc)) {
    checks.push(chk(".npmrc 인증 토큰", "FAIL", { gate: "G6", sec: "high", evidence: ".npmrc 에 _authToken/_password 포함", fix: ".npmrc 에서 토큰 제거(환경변수 ${NPM_TOKEN} 참조) + 회수" }));
  } else {
    checks.push(sec(".npmrc 인증 토큰", "PASS", "info", npmrc ? ".npmrc 토큰 미포함" : ".npmrc 없음", ""));
  }

  // 9) 커밋된 아카이브/빌드 (시크릿/산출물 동봉 위험)
  const archives = listFiles(repoRoot).filter((f) => /\.(zip|tar|tgz|gz|7z|pfx|p12)$/i.test(f));
  checks.push(
    archives.length === 0
      ? sec("루트 아카이브 동봉", "PASS", "info", "루트에 zip/아카이브 미발견", "")
      : sec("루트 아카이브 동봉", "WARN", "low", `루트 아카이브: ${archives.join(", ")} (시크릿/빌드 동봉 위험)`, "배포 아카이브는 .gitignore 처리 또는 내용 점검")
  );

  // 10) git 추적 시크릿 (best-effort). 파일 종류별로 위험을 구분한다.
  if (exists(P(".git"))) {
    const ls = runCmd("git", ["-C", repoRoot, "ls-files"], { timeoutMs: 15000, shell: false });
    if (ls.ok) {
      const tracked = ls.stdout.split(/\r?\n/).filter(Boolean);
      // 본질적 시크릿 파일: .env(예제 제외), 키/인증서
      const secretFiles = tracked.filter((f) => /(^|\/)\.env$|(^|\/)\.env\.[^.]+$|\.pem$|\.pfx$|\.p12$|(^|\/)[^/]*\.key$/i.test(f) && !/\.env\.example$/i.test(f));
      // .npmrc 는 "토큰이 들었을 때만" 위험. 내용을 확인.
      const npmrcTracked = tracked.filter((f) => /(^|\/)\.npmrc$/i.test(f));
      const npmrcWithToken = npmrcTracked.filter((f) => {
        const t = readText(path.join(repoRoot, f));
        return t && /_authToken|_password|:_auth=/.test(t);
      });
      // node_modules 추적은 위생 문제(시크릿 아님).
      const nodeModTracked = tracked.some((f) => /(^|\/)node_modules\//i.test(f));

      const critical = [...secretFiles, ...npmrcWithToken];
      if (critical.length > 0) {
        checks.push(chk("git 추적 시크릿 파일", "FAIL", { gate: "G6", sec: "critical", evidence: `추적됨: ${critical.slice(0, 8).join(", ")}`, fix: "git rm --cached 로 추적 해제 + .gitignore 보강 + 노출 시크릿 회수(rotate)" }));
      } else {
        const note = [];
        if (npmrcTracked.length) note.push(`.npmrc 추적(토큰 없음: 설정용)`);
        if (nodeModTracked) note.push(`node_modules 추적(위생 권고)`);
        checks.push(sec("git 추적 시크릿 파일", "PASS", "info", `추적 ${tracked.length}개 중 시크릿 파일 없음${note.length ? ` — ${note.join(", ")}` : ""}`, note.length ? "불필요한 추적 파일은 git rm --cached 권장" : ""));
      }
      if (nodeModTracked) {
        checks.push(sec("node_modules 추적", "WARN", "low", "node_modules/ 가 git 에 추적됨(저장소 비대/위생)", ".gitignore 에 node_modules/ 추가 후 git rm -r --cached node_modules"));
      }
    } else {
      checks.push(sec("git 추적 시크릿 파일", "SKIP", "info", `git ls-files 실패: ${ls.error || ls.code}`, "git 사용 가능 환경에서 재실행"));
    }
  } else {
    checks.push(sec("git 추적 시크릿 파일", "SKIP", "info", ".git 없음 → 추적 검사 생략", ""));
  }

  // 11) 의존성 취약점 (npm audit, opt-in/best-effort)
  if (!audit) {
    checks.push(sec("의존성 취약점(npm audit)", "SKIP", "info", "--audit 미지정으로 생략", "node judge/checks/run-all.mjs --audit 로 실행"));
  } else if (!exists(P("package-lock.json")) && !exists(P("npm-shrinkwrap.json"))) {
    checks.push(sec("의존성 취약점(npm audit)", "SKIP", "info", "lockfile 없음 → audit 생략", "npm install 로 lockfile 생성 후 재실행"));
  } else {
    const r = runCmd("npm", ["audit", "--json", "--omit=dev"], { cwd: repoRoot, timeoutMs: 60000 });
    let parsed = null;
    try {
      parsed = JSON.parse(r.stdout || "{}");
    } catch {
      /* ignore */
    }
    const v = parsed?.metadata?.vulnerabilities;
    if (!v) {
      checks.push(sec("의존성 취약점(npm audit)", "SKIP", "info", `audit 결과 파싱 실패(${r.error || r.code || "offline?"})`, "온라인 환경에서 npm audit 재실행"));
    } else {
      const total = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
      const ev = `critical ${v.critical || 0} / high ${v.high || 0} / moderate ${v.moderate || 0} / low ${v.low || 0}`;
      if ((v.critical || 0) > 0) checks.push(sec("의존성 취약점(npm audit)", "FAIL", "critical", ev, "npm audit fix 또는 취약 패키지 업그레이드"));
      else if ((v.high || 0) > 0) checks.push(sec("의존성 취약점(npm audit)", "WARN", "high", ev, "npm audit fix 로 high 해소"));
      else if (total > 0) checks.push(sec("의존성 취약점(npm audit)", "WARN", "medium", ev, "여유 시 moderate/low 패치"));
      else checks.push(sec("의존성 취약점(npm audit)", "PASS", "info", "알려진 취약점 없음", ""));
    }
  }

  return { id: "security", title: "보안 advisory", checks };
}
