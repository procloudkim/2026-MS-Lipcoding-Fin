# ADR 0005 — 배포 전 보안 하드닝

- 상태: Accepted
- 날짜: 2026 본선
- 관련: 자체 심사 보안 advisory(등급 C→A), 점수 sdk-depth 18→20

## 맥락

자체 심사기(judge/checks) 결과 READY 98/100, 7/7 게이트 PASS였으나 두 가지 개선점:
1. **보안 advisory 등급 C(high)** — 라이브에서 `GET /api/_diag?key=autopilot`가 cwd,
   `/home/site/wwwroot`, node_modules 디렉터리 목록을 200으로 노출. 정적 키("autopilot")만으로 접근 가능.
   에러 응답이 `detail: err.message`로 내부 구조/경로를 유출. helmet 등 보안 헤더 부재.
   SDK `approveAll`로 모든 도구 권한 자동 승인.
2. **sdk-depth 18/20** — 로컬 부팅 시 SDK 타임아웃→fallback이라 라이브 분류가 WARN.

## 결정

P0 보안(회귀 금지, 응답 스키마/200 계약 유지):

1. **진단 라우트 제거**: `/api/_diag`를 server.js에서 완전 삭제. 본래 Azure 런타임 경로
   디버깅용이었고, `resolveCliPath()` 자동화로 목적을 달성했으므로 운영에서 불필요.
   (정적 스캐너가 라우트 리터럴 존재만으로 감점하므로, 게이트/조건부 토큰보다 삭제가 정직·안전.)
2. **에러 마스킹**: `/api/plan`·`/api/assist` catch에서 응답의 `detail` 필드 제거.
   사용자에겐 일반 `notice`만, 상세는 `console.error`로 서버 로그에만 기록.
3. **helmet 도입**: `app.use(helmet({...}))`. CSP는 인라인 스크립트가 없음을 확인 후 적용 —
   `script-src 'self'`, `style-src`/`font-src`에 Pretendard CDN(cdn.jsdelivr.net)만 예외.
   HSTS, X-Frame-Options, X-Content-Type-Options 포함. `X-Powered-By` 제거.
4. **권한 범위 축소**: `approveAll`(전면 승인) → `scopedPermission`. 이 앱은 텍스트→JSON만
   필요하므로 `commands`(셸)/`write`/`url`/`mcp`/확장 권한 요청은 `{ kind: "reject" }`,
   무해한 요청만 `{ kind: "approve-once" }`. 프롬프트 주입으로 위험 도구가 호출돼도 차단.

P1 점수:

5. **sdk-depth 보강**: README에 "로컬에서 source=copilot-sdk 재현" 절(토큰+런타임 경로) 명문화,
   `.env.example`에 `COPILOT_GH_TOKEN`/`COPILOT_CLI_PATH` 안내. `SDK_TIMEOUT_MS` 기본을
   60000→20000으로 합리화(타임아웃 시 fallback은 유지).

## 결과 (실측)

- 단위 smoke 28 PASS. `/api/plan`·`/api/assist` 로컬 `source=copilot-sdk`(scoped 권한으로도 정상).
- helmet 헤더 확인(CSP/HSTS/X-Frame-Options), `X-Powered-By` 없음.
- `GET /api/_diag` → 404. 에러 응답에 `detail`/`err.message` 없음. 빈 입력 → 400.
- 응답 스키마(`source`/`plan`/`artifact`/200) 불변 — 회귀 없음.

## 한계

- 데모용 사용자 토큰은 만료 가능(만료 시 fallback로 자동 강등, 데모 유지).
- CSP는 Pretendard CDN을 허용(완전 self-host 시 외부 의존 제거 가능, 후속 과제).
