# AI 심사 리포트 — {{appName}}

| 항목 | 값 |
| --- | --- |
| 앱명 | {{appName}} |
| 평가 일시 | {{evaluatedAt}} |
| 평가자 | {{evaluator}} |
| 리포트 소스 | {{sourceReport}} |

## 한 줄 평결

**{{verdict}}** — 총점 **{{totalScore}}/100**

{{oneLineSummary}}

## P0 게이트

| 게이트ID | 제목 | 상태 | 증거 |
| --- | --- | --- | --- |
| G1 | 개인 생산성 향상 웹앱 | {{G1.status}} | {{G1.evidence}} |
| G2 | Copilot SDK 실제·추적가능 사용 | {{G2.status}} | {{G2.evidence}} |
| G3 | Azure 배포 + public URL smoke | {{G3.status}} | {{G3.evidence}} |
| G4 | 100% 한국어 UI | {{G4.status}} | {{G4.evidence}} |
| G5 | 로컬 부팅 + 핵심 액션 동작 | {{G5.status}} | {{G5.evidence}} |
| G6 | 시크릿 미커밋 / .gitignore 보호 | {{G6.status}} | {{G6.evidence}} |

## 차원 점수

| 차원 | 가중치 | 점수 | 근거 |
| --- | ---: | ---: | --- |
| productivity | 15 | {{productivity.score}} | {{productivity.reason}} |
| sdk-depth | 20 | {{sdkDepth.score}} | {{sdkDepth.reason}} |
| verification | 15 | {{verification.score}} | {{verification.reason}} |
| honesty | 15 | {{honesty.score}} | {{honesty.reason}} |
| design | 15 | {{design.score}} | {{design.reason}} |
| engineering | 10 | {{engineering.score}} | {{engineering.reason}} |
| docs | 10 | {{docs.score}} | {{docs.reason}} |

## 섹션별 상세 체크

| 체크명 | 상태 | 증거 | 수정 |
| --- | --- | --- | --- |
| {{check.name}} | {{check.status}} | {{check.evidence}} | {{check.fix}} |

## 다음 최소 수정 우선순위

1. {{nextFix1}}
2. {{nextFix2}}
3. {{nextFix3}}

## 심사위원 코멘트

{{judgeComment}}
