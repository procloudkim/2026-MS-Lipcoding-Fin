# 20 Deploy Evidence — Azure App Service (LIVE)

> 결론: Node 앱이 Azure에 배포되어 public URL로 동작한다. SDK 미가용 환경에서
> fallback(`source: "fallback"`, HTTP 200)로 데모 가용성을 유지한다.

## 배포 정보
- Live URL: https://haru-jeongri-20260620122907.azurewebsites.net
- Resource group: `rg-haru-jeongri`
- Region: koreacentral
- OS/Plan: Linux, SKU F1 (Free), App Service Plan `pro.cloud.kim_asp_3139`
- Runtime: NODE|24-lts
- 배포 명령: `az webapp up --name ... --sku F1 --runtime "NODE:24-lts" --os-type Linux`
- 빌드: Oryx "Build successful" → "Site started successfully"

## Public URL smoke (PASS)
- `GET /` → HTTP 200, len 3691, title "하루 정리" 포함
- `GET /api/health` → `{ ok: true, app: "haru-jeongri", model: "auto" }`
- `POST /api/copilot` → HTTP 200, `source: fallback`, top3 3개,
  notice "Copilot SDK 미연결 — 오프라인 정리 모드로 처리했습니다." (~207ms)
- 브라우저 smoke: 예시 입력 → "오늘 정리하기" → Top3/분류(업무·개인·기타)/내일 렌더,
  우상단 "오프라인 정리 모드" 배지, 푸터 "서버 정상" (img/azure-smoke.png)

## 환경 분리 요약
- 로컬: `source: copilot-sdk` (실제 모델 응답) — 10-sdk-evidence.md
- Azure: `source: fallback` (런타임/인증 미보장) — 본 문서
- 동일 스키마/화면, source만 배지로 구분 → 정직한 증명.
