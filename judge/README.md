# AI 심사위원(judge)

`judge/`는 **천하제일 립코딩 2026 본선** 최종물을 제출 전에 사전 검수하는 재사용 심사 도구다. 목표는 P0 탈락 사유를 먼저 차단하고, Copilot SDK·Azure·한국어 UI·검증 증거를 같은 기준으로 기록하는 것이다.

## 폴더 구조

```text
judge/
├─ README.md
├─ agent/
│  └─ lipcoding-judge.md
├─ checks/
│  ├─ _ctx.mjs              # 공용 헬퍼(부팅/요청/라우트발견/명령)
│  ├─ 01-static-evidence.mjs
│  ├─ 02-local-smoke.mjs
│  ├─ 03-sdk-evidence.mjs
│  ├─ 04-azure-smoke.mjs
│  ├─ 05-ui-korean.mjs
│  ├─ 06-security.mjs       # 배포 전 보안 advisory
│  └─ run-all.mjs
├─ reports/
│  ├─ judge-report-<slug>-<timestamp>.md / .json
│  └─ latest-<slug>.md / .json   # 프로젝트별 최신
├─ rubric/
│  ├─ weights.json          # 게이트/차원/판정/보안등급(단일 진실원천)
│  ├─ 00-p0-gates.md
│  ├─ 10-scoring-rubric.md
│  └─ 20-evidence-map.md
└─ templates/
   └─ judge-report-template.md
```

## 빠른 시작

| 목적 | 명령 |
| --- | --- |
| 현재 repo 로컬 검증 | `node judge/checks/run-all.mjs --local` |
| **다른 프로젝트 평가** | `node judge/checks/run-all.mjs --target <projectDir> --local` |
| 로컬 + Azure 공개 URL | `node judge/checks/run-all.mjs --local --azure-url <URL>` |
| 의존성 취약점 포함 | `node judge/checks/run-all.mjs --local --audit` |
| npm 단축 실행 | `npm run judge` |

추가 플래그: `--skip-local`(서버 부팅 생략), `--port <n>`, `--out <dir>`(기본 `judge/reports`), `--quiet`.

> `--target`는 임의 폴더(다른 contest 프로젝트)를 평가한다. rubric/weights 는 judge 설치 위치에서 로드하고, 리포트는 프로젝트명(slug)으로 분리 저장된다. 대상 프로젝트는 먼저 `npm install` 되어 있어야 로컬 부팅(G5)이 통과한다.

## P0 게이트 요약

| 게이트 | 제목 | 판정 |
| --- | --- | --- |
| G1 | 개인 생산성 향상 웹앱 | PASS/FAIL |
| G2 | Copilot SDK 실제·추적가능 사용 | PASS/FAIL |
| G3 | Azure 배포 + public URL smoke | PASS/FAIL |
| G4 | 100% 한국어 UI | PASS/FAIL |
| G5 | 로컬 부팅 + 핵심 액션 동작 | PASS/FAIL |
| G6 | 시크릿 미커밋 / `.gitignore` 보호 | PASS/FAIL |

## 점수 차원

| 차원 | 가중치 |
| --- | ---: |
| productivity | 15 |
| sdk-depth | 20 |
| verification | 15 |
| honesty | 15 |
| design | 15 |
| engineering | 10 |
| docs | 10 |

판정 규칙: 게이트 FAIL 존재 → `BLOCK`; 전 게이트 PASS + 총점 80 이상 → `READY`; 그 외 → `CONDITIONAL`. `conditional` 기준값은 60이다.

## 🔒 보안 advisory (배포 전 점검)

`06-security.mjs`가 제품 점수(100점)와 **분리된** 보안 등급을 산출한다. 등급은 발견된 최악 severity 기준: critical→D, high→C, medium→B, low→A, 무결→A+.

| 점검 | severity 예 |
| --- | --- |
| 진단/디버그 엔드포인트 노출(`/api/_diag` 등 fs·env 유출) | high |
| 에러 원문(detail) 클라이언트 유출 | medium |
| CORS 와일드카드 | medium |
| 보안 헤더(helmet) 부재 / SDK approveAll | low |
| 요청 본문 크기 제한 부재 | low |
| 하드코딩 시크릿 / `.npmrc` 토큰 / git 추적 시크릿 | critical·high → **G6 게이트에도 반영(BLOCK 가능)** |
| 의존성 취약점 `npm audit` | `--audit` 시 critical→FAIL |

하드코딩/추적 시크릿은 보안 advisory이자 P0 게이트 G6 FAIL이라 제출 자체를 BLOCK한다. 나머지(노출 엔드포인트·헤더 등)는 점수를 깎지 않고 "배포 전 수정 권고"로 보고한다.

## 자동 머신 vs 사람(LLM) 심사

| 주체 | 역할 | 산출물 |
| --- | --- | --- |
| 자동 체크 머신 | 서버 부팅, API smoke, 정적 증거, Azure URL, 한국어 UI, 보안 점검 등 결정적 증거 수집 | `judge-report-<slug>-<timestamp>.json/.md` |
| LLM 심사위원 | 생산성 가치, 디자인 품질, 정직성, 문서-코드 드리프트를 증거 기반으로 종합 | 템플릿 형식의 최종 평결 |

## 리포트 위치

기본 출력은 `judge/reports/`이며 프로젝트별로 `latest-<slug>.md/.json`을 남긴다. `run-all.mjs`는 `weights.json`을 읽어 게이트 판정·가중 총점·보안 등급을 계산하고, 게이트 FAIL이 있으면 exit code 1로 종료한다.

## 한계와 정직성

- 라이브 Copilot SDK 응답은 런타임·인증·네트워크 환경에 의존한다.
- 로컬은 `source=copilot-sdk`가 나올 수 있고, Azure는 인증 미보장으로 `source=fallback` 및 “오프라인” 배지가 정상 설계일 수 있다.
- 현재 실제 API는 `GET /api/health`, `POST /api/plan`, `POST /api/assist`이다. README/브리프의 `/api/copilot` 언급은 드리프트로 잡아야 한다.
