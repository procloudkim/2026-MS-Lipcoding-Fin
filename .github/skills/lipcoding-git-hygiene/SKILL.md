---
name: lipcoding-git-hygiene
description: Manage Git hygiene for a fresh Lipcoding contest repository. Use when checking .gitignore, deciding commit boundaries, avoiding secrets, grouping smoke-verified changes, preparing submission history, or defining files that must not be committed during the contest.
---

# Lipcoding Git Hygiene

Use this skill when a new contest repository is created or when changes need to be committed safely.

This skill does not replace the official contest rules. During lipcoding time, use Git only through the allowed Copilot/Copilot CLI flow and follow the keyboard/mouse restrictions.

## Goals

- Keep the repo submit-ready.
- Prevent secrets and generated artifacts from entering Git history.
- Commit only smoke-verified, explainable changes.
- Avoid late history surgery that can break submission.

## First Repo Check

1. Confirm the current folder is the contest repo root.
2. Confirm `.gitignore` exists before large implementation begins.
3. Confirm `.github/copilot-instructions.md` and `.github/skills` are either intentionally committed or intentionally copied from the prep repo.
4. Confirm there is no `.env`, Copilot SDK credential, credential file, local database dump, or token in tracked files.
5. Confirm README or equivalent run instructions exist before submission.

## Baseline .gitignore

Ensure these are ignored unless the official task requires otherwise:

```gitignore
# secrets
.env
.env.*
!.env.example
*.pem
*.key
*.pfx
*.p12

# dependencies
node_modules/
.venv/
venv/
__pycache__/

# builds and caches
dist/
build/
.next/
.turbo/
.vite/
.cache/
coverage/

# test output
playwright-report/
test-results/
*.log

# local cloud/deploy state
.azure/
.azd/.env
```

Keep `.env.example` with placeholders such as `AZURE_LOCATION=<your-region>` and SDK-specific fake values only.

## Commit Rules

- Commit after a meaningful smoke PASS, not after every file edit.
- Prefer small commits with one clear purpose.
- Group by deliverable: `setup`, `vertical-slice`, `ui`, `api`, `deploy`, `docs`, `fix`.
- Keep commit messages short: `type: summary`.
- Include run instructions, smoke evidence notes, and submission docs when they support judging or recovery.
- Before each commit, check changed files, ignored files, and secret risk.

## Not Rules

- Do not commit `.env` or real credentials.
- Do not commit Azure/GitHub/Copilot tokens or local auth state.
- Do not commit Copilot SDK keys, client secrets, auth artifacts, or captured SDK responses that contain sensitive data.
- Do not commit dependency folders or generated build output.
- Do not commit local database dumps unless the task explicitly requires seed data and the file is sanitized.
- Do not commit failing intermediate refactors as if they are progress.
- Do not commit generated code before local/browser/API smoke.
- Do not run destructive Git commands such as hard reset unless explicitly approved.
- Do not rewrite history, squash, force push, or rename branches after 16:00.
- Do not delete unknown files just to make `git status` clean.
- Do not treat a clean Git status as proof that the app works.

## Time Rules

| Phase | Git behavior |
| --- | --- |
| 10:30~11:30 setup | Create repo, `.gitignore`, instructions, skills, initial commit if allowed. |
| 12:30~15:30 build | Commit only after smoke-verified slices. |
| 15:30~16:00 deploy hardening | Commit deploy docs, README, final fixes, submission evidence. |
| 16:00~16:30 freeze | No history cleanup. Only submit-critical fix commits. |
| After submission | Optional retrospective notes only. |

## Output Format

Return exactly:

```markdown
## Git Hygiene State
- Repo root:
- Current phase:
- Git status summary:

## .gitignore / Secret Check
| Item | Status | Action |
| --- | --- | --- |

## Commit Candidates
| Group | Files | Required smoke evidence | Commit message |
| --- | --- | --- | --- |

## Do Not Commit
| File / pattern | Reason | Fix |
| --- | --- | --- |

## Decision
- Commit now / wait / fix ignore / block:
```

## Verification Prompt

```text
lipcoding-git-hygiene 스킬을 사용해. 현재 변경사항을 커밋 가능한 단위와 커밋하면 안 되는 파일로 나누고, .gitignore/secret 위험을 점검해줘. smoke PASS가 없는 변경은 커밋 후보에서 제외해줘.
```
