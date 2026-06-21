# 05. API 명세

> 모든 응답은 JSON. 인증 토큰은 **서버 환경변수**로만 사용되며 클라이언트에 노출되지 않는다.
> 공통 정책: 본문 `256KB` 제한, `/api/plan` 입력 `6000자` 컷, SDK 응답 `20초` 타임아웃.

---

## 1. `GET /api/health`

서버·인증 모드 상태 점검.

**응답 200**
```json
{ "ok": true, "app": "oh-my-dayauto", "model": "auto", "authMode": "token" }
```

| 필드 | 의미 |
| --- | --- |
| `authMode` | `"token"`(서버 토큰 인증) / `"login"`(로그인 사용자) |
| `model` | 사용 모델(기본 `auto`) |

---

## 2. `POST /api/plan` — 핵심: 맥락 → 우선순위 결정

**요청**
```json
{ "context": "분기 보고서 마감\n고객사 회신 메일\n언젠가 사이드 프로젝트" }
```
> `context` 또는 `text` 키 허용. 빈 값이면 `400`.

**응답 200 (정상 — AI 경로)**
```json
{
  "source": "copilot-sdk",
  "model": "auto",
  "authMode": "token",
  "plan": {
    "headline": "오늘은 마감 업무부터 끝내고 나머지는 덜어냅니다.",
    "orderRationale": "입력 순서가 아니라 마감·영향·시간 민감도로 다시 정렬했어요.",
    "decisions": [
      { "item": "분기 보고서 마감", "verdict": "DO_NOW", "verdictKo": "지금 바로",
        "why": "마감·영향이 가장 큽니다.", "when": "15:00", "rank": 1 }
    ],
    "timeline": [
      { "time": "15:00–16:20", "block": "분기 보고서 작성", "focus": "본문 우선 완성" }
    ],
    "firstArtifact": {
      "forItem": "분기 보고서 마감", "type": "outline", "typeKo": "문서 개요",
      "title": "분기 보고서 개요", "content": "- 요지: ...\n- 핵심 3가지: ..."
    },
    "amplify": { "decisionsMade": 3, "artifactsDrafted": 1, "minutesSaved": 24 }
  }
}
```

**응답 200 (폴백 — 오프라인 결정 엔진)**
```json
{
  "source": "fallback",
  "model": null,
  "plan": { "...동일 스키마..." },
  "notice": "Copilot SDK 미연결 — 오프라인 결정 엔진으로 처리했습니다."
}
```

**응답 400 (빈 입력)**
```json
{ "error": "EMPTY_INPUT", "message": "오늘의 맥락을 입력해주세요." }
```

> 🔒 **보안**: 실패 시에도 내부 에러 원문(`err.message`/스택/경로)은 응답에 포함하지 않는다. 상세는 서버 로그(`console.error`)로만 남긴다.

### `plan` 필드 사전

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `headline` | string | 오늘의 한 줄 전략 |
| `orderRationale` | string | **왜 이 순서인지**(투명성 핵심) |
| `decisions[]` | array | 항목별 결정 — `item·verdict·verdictKo·why·when·rank` |
| `decisions[].verdict` | enum | `DO_NOW·SCHEDULE·DELEGATE·DEFER·DROP` |
| `decisions[].rank` | number | 표시 순번(1부터, 정렬 결과) |
| `timeline[]` | array | 시간블록 — `time·block·focus` (현재시각 이후) |
| `firstArtifact` | object\|null | 1순위 작업의 첫 초안 — `type·title·content` |
| `amplify` | object | 효과 지표 — `decisionsMade·artifactsDrafted·minutesSaved` |

---

## 3. `POST /api/assist` — 작업 → 즉시 시작용 작업물

`/api/plan`으로 받은 1순위 작업의 **초안**을 생성(멀티스텝 에이전트 호출).

**요청**
```json
{ "task": "팀 회의 자료 준비", "type": "agenda" }
```
> `type` 생략 시 작업 텍스트의 키워드로 추론. 허용: `email·agenda·checklist·outline·message`.

**응답 200**
```json
{
  "source": "copilot-sdk",
  "model": "auto",
  "artifact": {
    "type": "agenda", "typeKo": "회의 안건",
    "title": "팀 회의 안건",
    "content": "1. 목표 확정 (5분)\n2. 현황 공유 (10분)\n..."
  }
}
```

**응답 400 (빈 작업)**
```json
{ "error": "EMPTY_TASK", "message": "도와줄 작업을 지정해주세요." }
```

---

## 4. 상태 코드 요약

| 코드 | 상황 | 비고 |
| --- | --- | --- |
| `200` | 정상 — `source: copilot-sdk` 또는 `fallback` | 폴백도 200(데모 가용성) |
| `400` | 빈 입력 | `error` 코드 + 한국어 메시지 |
| `404` | 정의되지 않은 경로 | (진단 라우트 `/api/_diag`는 보안상 제거됨) |

---

## 5. cURL 재현 예시 (로컬)

```bash
# 1) 서버 기동
npm install && npm start            # http://localhost:3000

# 2) 헬스
curl -s http://localhost:3000/api/health

# 3) 우선순위 결정
curl -s -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  --data '{"context":"분기 보고서 마감\n고객 회신\n언젠가 정리"}'

# 4) 초안 생성
curl -s -X POST http://localhost:3000/api/assist \
  -H "Content-Type: application/json" \
  --data '{"task":"분기 보고서 마감","type":"outline"}'
```

> 실제 `source:"copilot-sdk"`까지 재현하려면 `COPILOT_GH_TOKEN`(=`gh auth token`)과 Copilot CLI 런타임이 필요하다. 없으면 자동으로 `source:"fallback"`로 동작한다(동일 스키마).
