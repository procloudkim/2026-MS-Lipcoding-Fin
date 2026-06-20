# 20 Deploy Evidence — Azure App Service (READY)

> 상태: 앱은 Azure 배포 준비 완료(production-shaped). 실제 public URL은 배포 후 기록한다.
> 기존 "하루 정리"와 **별도 앱 이름/리소스**로 배포해 분리한다.

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

## Public URL smoke (배포 후 기록 예정)
- `GET /` → 200, title "안심육아 브리프"
- `GET /api/health` → `{ ok: true, app: "ansim-yuka" }`
- `GET /api/categories` → 6 카테고리/4 축/8 출처
- `POST /api/brief` → 200, `source: fallback`, 구조화 브리프 + notice
- 브라우저: 입력 → 브리프 렌더 + "오프라인 근거 엔진" 배지

## 환경 분리 요약
- 로컬: `source: copilot-sdk`(실제 모델 응답) — 10-sdk-evidence.md
- Azure: `source: fallback`(런타임/인증 미보장)
- 동일 스키마/화면, source만 배지로 구분 → 정직한 증명.
