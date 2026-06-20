# ADR 0002 — Copilot SDK 통합과 프로덕션 구동

- 상태: Accepted (Supersedes 초기 fallback-only 접근)
- 날짜: 2026 본선
- 제약: Copilot SDK 실제 사용(P0), Azure 배포(P0)

## 맥락

`@github/copilot-sdk`(v1.0.x)는 LLM HTTP API가 아니라 **GitHub Copilot CLI 런타임을
JSON-RPC로 제어**하는 TypeScript SDK다. `CopilotClient`가 런타임 프로세스를 spawn 하고
세션을 만들어 프롬프트를 보낸다. 따라서 서버/클라우드 구동에는 두 관문이 있다.

1. 런타임(`@github/copilot`) 실행 파일 존재
2. 비대화식 인증(서버에서 OAuth 디바이스 플로우 불가)

초기 설계는 "로컬에서만 SDK, Azure는 fallback"이었으나, 배포 URL이 fallback만 보이는 것은
P0 충족의 신뢰도를 떨어뜨린다. 그래서 **프로덕션에서 실제 SDK 구동**을 목표로 재설계했다.

## 조사/실험 (코드·실측 근거)

- 토큰 인증 실현성: `new CopilotClient({ gitHubToken, useLoggedInUser:false })`로
  대화식 로그인 없이 세션 생성·응답 성공(로컬 실측). → 서버 인증 가능.
- 모델: `gpt-5`는 런타임이 "not available"로 거부 → **`auto`**(자동 선택) 사용.
- 런타임 spawn: SDK는 `resolvedCliPath = conn.path ?? COPILOT_CLI_PATH ?? getBundledCliPath()`로
  결정하고 `--headless --no-auto-update --stdio` 등으로 실행.
- Azure 레이아웃 문제: Oryx의 compressed `node_modules`(런타임 `/node_modules`에 전개) +
  `@github/copilot`가 `@github/copilot-sdk/node_modules/@github/copilot`에 중첩 설치됨.
  `getBundledCliPath()`의 경로 계산이 한 세그먼트 어긋나 `@github/index.js`를 찾는 버그 발생.
- 실제 런타임 진입점: 해당 디렉터리에 `index.js`가 **없고** `npm-loader.js`가 진입점
  (플랫폼 패키지 `@github/copilot-linux-x64`를 로드). `/api/_diag`로 실측 확인.

## 결정

1. **인증**: `COPILOT_GH_TOKEN`(또는 `COPILOT_SDK_AUTH_TOKEN`/`GITHUB_TOKEN`) 환경변수로
   토큰 인증. Azure에는 App Setting으로 주입(커밋 금지).
2. **런타임 해석**: `server.js`에 `resolveCliPath()` 구현 — `@github/copilot` 패키지를
   여러 base에서 탐색하고, `package.json.bin`/`main`/후보 파일을 검사해 실제 진입점
   (`npm-loader.js`)을 찾아 `COPILOT_CLI_PATH`로 설정. SDK 기본 자동탐색 버그를 우회.
3. **fallback**: SDK 실패/타임아웃 시 `lib.js`의 결정적 엔진이 동일 스키마로 200 반환,
   응답 `source`와 화면 배지로 출처 구분.
4. **엔드포인트 2개**로 멀티스텝 에이전트: `/api/plan`(결정/타임라인) + `/api/assist`(작업물).

## 결과 (실측)

- **로컬**: `source: copilot-sdk`, `authMode: token`, plan+assist 실응답.
- **프로덕션(Azure)**: 라이브 URL이 `source: copilot-sdk`, `authMode: token` 반환.
  ~31s(런타임 콜드 spawn) 후 결정/타임라인/문서개요 생성. (`img/azure-sdk-live.png`)
- 단위 smoke 21 PASS.

## 리스크 / 한계

- 런타임 패키지(~500MB)로 Azure 빌드/콜드스타트가 길다 → **B1 + Always On**으로 완화.
- 데모용 사용자 토큰 사용(만료 가능). 실서비스라면 전용 토큰/시크릿 매니저 권장.
- `/api/_diag`는 진단 보조(게이트, 비밀 미노출).
