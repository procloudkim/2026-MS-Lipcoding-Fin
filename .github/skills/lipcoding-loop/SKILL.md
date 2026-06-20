---
name: lipcoding-loop
description: "Run a compact evidence-bound implementation loop for Lipcoding with personal productivity web app, Copilot SDK, and Azure deployment constraints. Use when the user wants an ulw-loop-like process in VS Code Copilot: define goal, success criteria, smallest next slice, execute, capture smoke evidence, and decide continue/freeze."
---

# Lipcoding Loop

Use this skill to keep Copilot in a tight build-and-verify loop during the contest.

This is a Copilot-compatible lightweight loop. It is not the OMO `ulw-loop` runtime and does not provide CLI state, subagent orchestration, or automatic reviewer gates.

## Inputs

- Known top-level rules: personal productivity web app, Copilot SDK required, Azure cloud deployment required.
- Official task text or current app state.
- Current time and contest phase.
- Available stack, repo files, and Azure constraints.
- Existing event brief and trace graph, if present.

## Loop Contract

At the start of each loop, state:

1. Goal: one concrete deliverable.
2. Phase: setup, plan, build, verify, deploy, or freeze.
3. Success criteria: two to four observable checks.
4. Evidence channel for each criterion:
   - command output
   - API response
   - Copilot SDK behavior
   - browser smoke
   - Azure public URL smoke
   - screenshot or concise manual observation
5. Smallest next slice.
6. Kill rule and stop rule.

## Procedure

1. Read `.github/copilot-instructions.md`.
2. If the task is newly revealed, use `lipcoding-wiki-graph` first.
3. Pick one vertical slice with a clear trace:
   - requirement -> Copilot SDK use -> screen/action -> data/API -> local smoke -> Azure deploy smoke
4. Implement only that slice.
5. Run the cheapest faithful smoke check.
6. Report the result as:
   - PASS with evidence
   - FAIL with exact error and next smallest fix
   - BLOCKED with missing external input
7. Update the event brief or Error Book only when it improves future execution.
8. Decide one of:
   - continue with next slice
   - fix current slice
   - deploy/freeze
   - stop and ask the user

## Contest Phase Rules

| Phase | Behavior |
| --- | --- |
| Before task reveal | Check environment and customization only. Do not prebuild a fixed app; wait for the user to enter the revealed topic. |
| First 20 minutes | Brief, graph, choose smallest vertical slice. |
| Build phase | One feature at a time, smoke after each meaningful change. |
| After 15:00 KST | If no Azure URL exists, start first deployment attempt. |
| After 15:30 KST | Prefer deploy, README, and submission hardening over new features. |
| After 16:00 KST | No new features or infra redesign. Only bug fixes, smoke, Azure URL, and submission fields. |

## Output Format

Return:

```markdown
## Loop State
- Goal:
- Phase:
- Smallest slice:

## Success Criteria
| Criterion | Evidence channel | Status |
| --- | --- | --- |

## Action
- Next edit or command:

## Evidence
- Result:
- Error, if any:

## Decision
- Continue / Fix / Deploy / Freeze / Ask:
```

## Rules

- Never claim a slice is done without an observed check.
- Do not add features whose test or smoke path is unclear.
- Do not accept a plan that omits personal productivity app scope, Copilot SDK usage, or Azure deployment.
- Do not install new MCP servers, global skills, hooks, custom agents, or plugins during the contest.
- Do not use Docker-dependent paths unless Docker has already passed smoke.
- Do not implement GraphRAG, vector DB, or custom memory unless the revealed task explicitly requires it.
- Keep evidence short and actionable.
