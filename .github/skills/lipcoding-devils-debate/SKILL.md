---
name: lipcoding-devils-debate
description: Run a compact Devil's Debate MAS loop for Lipcoding in VS Code Copilot, including mandatory personal productivity web app, Copilot SDK, and Azure deployment constraints. Use when choosing or cutting features, validating assumptions, or stress-testing a productivity app idea with PM, Tech Lead, User Advocate, CEO, and Devil's Advocate perspectives while preserving LLM-Wiki and graphify-style memory.
---

# Lipcoding Devil's Debate

Use this skill to simulate a lightweight multi-agent debate inside one Copilot Agent conversation.

This is not a true parallel MAS runtime and does not run Claude Code `/prd` or `/loop`. It preserves the important parts for Lipcoding: adversarial scope selection, LLM-Wiki memory, graphify-style trace edges, and a Devil's Advocate closure.

## Inputs

- Known top-level rules: personal productivity web app, Copilot SDK required, Azure cloud deployment required.
- Official task text.
- Candidate app idea or feature list.
- Time remaining.
- Current implementation and deployment status.
- Existing `prep/llm-wiki/00-event-brief.md` and trace graph, if present.

## Source Philosophy To Preserve

| Source idea | Copilot adaptation |
| --- | --- |
| PRD MAS roles | Role sections in one Copilot response. |
| Odd round CEO participation | First round includes CEO for vision/upside. |
| Even round closure without CEO | Optional closure round excludes CEO. |
| Devil's Advocate final voice | Devil always speaks last and owns the final risk gate. |
| LLM-Wiki | Debate results update stable wiki-style pages, not throwaway notes. |
| graphify | Debate outputs become nodes/edges with confidence tags. |
| QA gates | Small contest gates: user value, scope, Copilot SDK use, smoke path, Azure deploy, unresolved risk. |

## Round Budget

| Situation | Debate budget | Rounds |
| --- | --- | --- |
| Immediately after task reveal | 8-10 minutes | One 5-role round plus optional 4-role closure. |
| Choosing a second major feature | 3-5 minutes | One 4-role closure only. |
| Under 90 minutes remaining | 0 minutes | Skip debate and run `lipcoding-verify`. |
| After 16:30 KST | 0 minutes | No debate, no new features. |

## Input Language And Interrupts

- If the official task or user prompt is mostly Korean, keep debate and final handoff in Korean.
- Keep vote values as ASCII: `agree`, `conditional`, `reject`.
- If the user adds a new constraint mid-debate, mark it as `[INTERRUPT]`, add it to Open Questions or Decisions, and rerun only the closure round.
- Do not restart the whole debate unless the official task itself changed.

## Scope Estimator Lite

Before debating, classify the decision complexity:

| Complexity | Signals | Action |
| --- | --- | --- |
| Low | One user, one data object, no external API | Skip CEO if time is tight; one closure round is enough. |
| Medium | Multiple features or unclear scoring | Run full 5-role round. |
| High | External API, auth, privacy, Azure uncertainty, many personas | Run full round plus closure, then cut scope aggressively. |

Archive/rollup note: the original PRD MAS has post-run archive and system-wide graphify rollup. For Lipcoding, do not implement archive, Stop hooks, or rollup during the contest. If useful, copy final artifacts after submission for retrospective learning.

## Roles

Each role must produce concrete output, not generic advice.

| Role | Required output |
| --- | --- |
| PM | user, job-to-be-done, MVP boundary, scoring fit |
| Tech Lead | simplest architecture, Copilot SDK integration path, risky dependencies, deploy path |
| User Advocate | friction, Korean UX copy, accessibility, first-run clarity |
| CEO | upside, memorable demo angle, why this is worth judging |
| Devil's Advocate | failure modes, rule risk, time sink, what to cut |

## Procedure

1. Restate the decision being made.
2. State the time budget and whether the debate is full, closure-only, or skipped.
3. Run the role debate.
4. Require each role to vote `agree`, `conditional`, or `reject`.
5. Convert objections into one of:
   - `FIX`
   - `CUT`
   - `DEFER`
   - `ACCEPT_RISK`
6. Update the LLM-Wiki plan:
   - Problem
   - Users
   - Features
   - Risks
   - Decisions
   - Open Questions
   - Error Book if an earlier assumption was wrong
7. Update graph edges:
   - requirement -> feature
   - feature -> persona/pain
   - risk -> feature/deploy
   - decision -> risk/open-question
   - requirement -> Copilot SDK
   - Copilot SDK -> feature/API
   - feature -> screen/API/data
   - smoke -> Copilot SDK
   - smoke -> feature/requirement
   - deploy -> public URL smoke
   - decision -> vision/moonshot as `defers` when out of MVP
8. End with the smallest vertical slice and a handoff prompt for `lipcoding-loop`.

## Consensus Rule

- A feature is `KEEP` only if PM, Tech Lead, and User Advocate are at least `conditional`, and Devil's final objection is fixed, cut, deferred, or explicitly accepted.
- A concept is invalid if it is not a personal productivity web app.
- A final MVP is invalid if it omits real Copilot SDK usage or Azure deployment.
- CEO can raise upside but cannot override deployment, smoke, or rule risk.
- If time is short, prefer `CUT` over `FIX`.
- If a kept feature has no smoke path, it becomes `DEFER`.

## LLM-Wiki Ingest Contract

Each debate output must map into:

| Wiki page | What to add |
| --- | --- |
| Problem | task interpretation, target pain |
| Users / Personas | primary user, excluded users |
| Features | kept features only |
| Risks | unresolved, accepted, and deferred risks |
| Decisions | decisions with reason and timestamp |
| Open Questions | official-task ambiguities or missing evidence |
| Error Book | wrong assumptions and fixes |

## graphify Contract

Use these node types:

- Requirement
- Persona
- Pain
- Feature
- Risk
- Vision
- Decision
- Screen
- DataObject
- API
- CopilotSDK
- SmokeTest
- AzureDeploy

Use these edges:

| Edge | Meaning |
| --- | --- |
| `requires` | Requirement requires feature or CopilotSDK. |
| `serves` | Feature serves persona/pain. |
| `blocks` | Risk blocks feature or deployment. |
| `resolves` | Decision resolves risk/open question. |
| `implements` | Screen/API/Data implements feature. |
| `uses` | Feature or API uses CopilotSDK. |
| `verifies` | SmokeTest verifies feature/requirement. |
| `deploys` | AzureDeploy exposes the working app. |
| `defers` | Decision defers moonshot or risky feature. |

Confidence tags:

- `EXTRACTED`: directly from official task or observed app.
- `INFERRED`: reasonable assumption from debate.
- `AMBIGUOUS`: needs confirmation or smoke.

Graph lint before implementation:

- No kept feature may lack a `verifies` edge.
- No kept feature may be blocked by unresolved `Risk`.
- The final MVP graph must include a real CopilotSDK node connected to a feature/API and smoke test.
- No `Vision` may expand MVP unless connected to a `defers` edge.
- Orphan risks must become `Open Questions` or `Cut` reasons.
- The most-connected node, or god-node, must appear in the chosen vertical slice or be explicitly deferred.

## Quality Gate

Before implementation, every gate must pass:

| Gate | Pass condition |
| --- | --- |
| User value | A real productivity pain and target user are named. |
| App type | The concept remains a personal productivity web app. |
| Scope | One vertical slice can run locally today. |
| Copilot SDK | The MVP has a real SDK-powered behavior and smoke plan. |
| Testability | The slice has browser/API smoke evidence planned. |
| Azure deploy | No dependency blocks simple Azure deployment. |
| Wiki integrity | No unresolved `!CONTRADICTION` on kept scope. |
| Graph integrity | Kept scope has requirement -> feature -> CopilotSDK/API/data/screen -> smoke -> Azure deploy path. |
| Devil closure | Devil's last objection is fixed, cut, deferred, or accepted in Decisions. |

## Output Format

Return exactly these sections:

```markdown
## Debate State
- Decision being made:
- Time budget:
- Round used:

## Role Debate
### PM
- ...
### Tech Lead
- ...
### User Advocate
- ...
### CEO
- ...
### Devil's Advocate
- ...

## Vote / Closure
| Role | Vote | Condition or objection |
| --- | --- | --- |

## Wiki Updates
| Page | Add / update |
| --- | --- |

## Graph Updates
| Source | Edge | Target | Confidence |
| --- | --- | --- | --- |

## Keep / Cut / Defer / Must Test
| Item | Decision | Reason |
| --- | --- | --- |

## Smallest Vertical Slice
- User:
- Action:
- Screen:
- Data/API:
- Copilot SDK use:
- Smoke:
- Azure deploy path:

## Handoff Prompt
Use lipcoding-loop to implement:
```

## Rules

- Keep debate short; the output must lead to implementation.
- Do not expand into a full PRD unless the official task asks for one.
- Devil's Advocate must speak last.
- CEO must not get the final word.
- Prefer cutting scope over adding architecture.
- Do not recommend LLM-Wiki, GraphRAG, vector DB, or graph visualization as app infrastructure unless explicitly required.
- Do not debate or build a fixed app concept before the user enters the revealed topic.
- Do not accept a plan that omits Copilot SDK use or Azure deployment.
- If a feature has no smoke path, cut or defer it.
- If time remaining is under 90 minutes, skip this skill and use `lipcoding-verify`.
