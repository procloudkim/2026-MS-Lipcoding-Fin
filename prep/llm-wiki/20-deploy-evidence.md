# 20 Deploy Evidence — Azure App Service (프로덕션 SDK)

> 결론: Node 앱이 Azure에 배포되어 public URL로 동작하며, **실제 Copilot SDK**가
> 프로덕션에서 구동된다(`source: copilot-sdk`, 토큰 인증).

## 배포 정보
- Live URL: https://haru-autopilot-20260620130000.azurewebsites.net
- Resource group: `rg-haru-jeongri` · Region: koreacentral
- Plan: `pro.cloud.kim_asp_3139` · OS: Linux · SKU: **B1(Basic)** · **Always On: on**
- Runtime: NODE|24-lts · 빌드: Oryx(`npm install` → `@github/copilot` 런타임 포함)
- 배포 명령: `az webapp up --runtime "NODE:24-lts" --os-type Linux`

## App Settings (시크릿은 커밋 안 함)
- `COPILOT_GH_TOKEN` = gh 토큰(App Setting 주입)
- `COPILOT_MODEL=auto`, `SDK_TIMEOUT_MS=90000`, `WEBSITES_CONTAINER_START_TIME_LIMIT=600`
- `COPILOT_CLI_PATH`는 런타임에서 `resolveCliPath()`가 자동 설정

## Public URL smoke (PASS)
- `GET /` → 200, 타이틀 "하루 오토파일럿"
- `GET /api/health` → `{ ok:true, app:"haru-autopilot", model:"auto", authMode:"token" }`
- `POST /api/plan` → **200, `source: copilot-sdk`**, 7 decisions, 타임라인, firstArtifact
- 브라우저: 입력→실행→결정/타임라인/작업물 렌더, 배지 "Copilot SDK 에이전트",
  푸터 "서버 정상 · 토큰인증" (`img/azure-sdk-live.png`)

## 엔지니어링 노트
- 런타임(~500MB) 설치로 빌드/콜드스타트가 길어 **F1→B1 스케일 + Always On**으로 완화.
- Azure compressed node_modules 레이아웃에서 런타임 진입점은 `@github/copilot/npm-loader.js`.
  `resolveCliPath()`가 이를 탐지해 `COPILOT_CLI_PATH`로 고정 → SDK spawn 성공.

## 환경 일관성
- 로컬·프로덕션 모두 `source: copilot-sdk`. SDK 실패 시에만 결정적 fallback(동일 스키마).
