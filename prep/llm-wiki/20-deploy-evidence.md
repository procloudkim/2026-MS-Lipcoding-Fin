# 20 Deploy Evidence — Azure App Service (LIVE)

> 상태: Azure에 배포되어 public URL로 동작한다. SDK 미가용 환경에서
> fallback(`source: "fallback"`, HTTP 200)으로 데모 가용성을 유지한다.
> 기존 "하루 정리"(rg-haru-jeongri)와 **별도 리소스그룹/앱**으로 분리 배포했다.

## 배포 정보
- Live URL: http://ansim-yuka-20260620131931.azurewebsites.net
- Resource group: `rg-ansim-yuka` (haru-jeongri와 분리)
- Region: koreacentral / OS: Linux / SKU: F1(Free) / Plan: `pro.cloud.kim_asp_6241`
- Runtime: NODE|24-lts
- 배포: `az webapp up` (Oryx "Build successful" 64s → "Site started successfully" 174s)

## 배포 준비 체크 (PASS)
- `process.env.PORT` 사용(Azure가 PORT 주입) — `server.js`.
- `npm start` = `node server.js`, `engines.node >= 20.19` — `package.json`.
- 정적 프론트(`public/`) + API를 단일 Node 서비스로 제공.
- secret 미커밋(`.gitignore`: `.env*`, `.azure/`, `.deploy-name`).

## 배포 명령 (검증된 패턴)
```bash
# 새 앱 이름(기존 haru-jeongri와 분리)
az webapp up --name ansim-yuka-<timestamp> --runtime "NODE:24-lts" --os-type Linux --sku F1 --location koreacentral
```
- Oryx 빌드(`npm install`) → `npm start`.
- SDK 런타임/인증 미보장 → 자동 fallback(`source: fallback`, HTTP 200)로 가용성 유지.

## Public URL smoke (PASS)
- `GET /` → 200, len 5190, title "안심육아 브리프" 포함
- `GET /api/health` → `{ ok: true, app: "ansim-yuka", model: "auto" }`
- `GET /api/categories` → 6 카테고리 / 4 축 / 8 출처
- `POST /api/brief { "query": "필립스 아벤트 쪽쪽이 비스페놀A 괜찮아?" }`
  → 200, `source: fallback`, verdict `CAUTION(주의)`, category `수유`, evidence 3, infoGaps 3, checklist 4, sources 5
- 브라우저 smoke: 입력 → 브리프 렌더 + 우상단 "오프라인 근거 엔진" 배지 + "서버 정상"
  ([`docs/evaluation/img/ansim-yuka-azure-smoke.png`](../../docs/evaluation/img/ansim-yuka-azure-smoke.png))

## 환경 분리 요약
- 로컬: `source: copilot-sdk`(실제 모델 응답) — 10-sdk-evidence.md
- Azure: `source: fallback`(런타임/인증 미보장)
- 동일 스키마/화면, source만 배지로 구분 → 정직한 증명.
