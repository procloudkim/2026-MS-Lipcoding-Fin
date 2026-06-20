---
name: lipcoding-wiki-graph
description: Convert a revealed Lipcoding task into an LLM-Wiki style brief and graphify-style trace graph before implementation, including mandatory personal productivity web app, Copilot SDK, and Azure deployment constraints. Use when requirements are unclear, when a debate produced decisions/risks, or before choosing the first vertical slice.
---

# Lipcoding Wiki Graph

Use this skill when the contest task is revealed or when requirements, risks, or implementation traces feel unclear.

This is a planning and working-memory skill. Do not implement LLM-Wiki, GraphRAG, a vector database, or graph visualization as app infrastructure unless the official task explicitly requires it.

## Inputs

- Known top-level rules: personal productivity web app, Copilot SDK required, Azure cloud deployment required.
- Official task text.
- Scoring, evaluation, submission, and deployment rules.
- Available stack and Azure constraints.
- Debate output from `lipcoding-devils-debate`, if any.
- Existing files in `prep/llm-wiki`.

## LLM-Wiki Procedure

1. Fill or update `prep/llm-wiki/00-event-brief.md`.
2. Separate:
   - verified facts
   - inferences
   - unknowns
   - constraints
   - success criteria
   - mandatory Copilot SDK use
   - mandatory Azure deployment path
   - accepted risks
3. Create or update wiki-style pages for Problem, Users / Personas, Data Objects, Actions, Screens / Routes, APIs, Tests / Smoke, Deployment, Features, Risks, Visions, Decisions, Open Questions, and Error Book.
4. Keep wiki pages stable and maintained. Update existing pages instead of regenerating everything.
5. Mark unresolved contradictions as `!CONTRADICTION`.
6. Move orphan risks and unresolved conditional votes into Open Questions.

## graphify Procedure

Build a trace graph with node types:

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

Required edges:

| Edge | Required meaning |
| --- | --- |
| requirement -> feature | `requires` |
| feature -> persona/pain | `serves` |
| risk -> feature/deploy | `blocks` |
| decision -> risk/open-question | `resolves` |
| requirement -> CopilotSDK | `requires` |
| CopilotSDK -> feature/API | `implements` |
| feature -> screen/API/data | `implements` |
| smoke -> CopilotSDK | `verifies` |
| smoke -> feature/requirement | `verifies` |
| deploy -> public URL smoke | `deploys` |
| decision -> vision/moonshot | `defers` when not in MVP |

Use confidence tags:

- `EXTRACTED`: official text or observed app behavior.
- `INFERRED`: reasonable conclusion from debate/context.
- `AMBIGUOUS`: requires user, judge, smoke, or docs confirmation.

## Graph Lint

Before implementation, block or revise the plan if:

- a kept feature has no `verifies` edge
- a kept feature is blocked by unresolved risk
- the MVP has no real Copilot SDK use path
- deployment has no smoke path
- AzureDeploy is missing from the submission trace
- a CEO vision expands MVP without a `defers` edge
- a god-node, the most connected concept, is absent from the vertical slice and not explicitly deferred
- `!CONTRADICTION` remains on kept scope

## Output Format

Return:

- Verified facts
- Inferences
- Unknowns
- Wiki updates
- Requirement graph
- Product graph
- Implementation trace graph
- Risk/decision graph
- First vertical slice
- Kill rules
- Next command or prompt

## Rules

- Do not invent hidden requirements.
- Do not select a fixed app concept before the user enters the revealed topic.
- Mark all assumptions explicitly.
- Prefer markdown tables and Mermaid graphs over installing graph libraries.
- Keep the first slice deployable and smoke-testable.
- Do not treat a feature as ready until Copilot SDK, route/API/data/test/deploy edges are present or explicitly deferred outside the current slice.
