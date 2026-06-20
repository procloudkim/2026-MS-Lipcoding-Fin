---
name: lipcoding-customization-setup
description: Set up and verify Copilot customizations for a fresh Lipcoding contest repository. Use when a new contest repo is cloned or created and Copilot instructions, agent skills, MCP usage, or VS Code customization visibility must be prepared quickly.
---

# Lipcoding Copilot Customization Setup

Use this skill when preparing a fresh contest repository.

## Goal

Make Copilot see the contest instructions and the small set of repo-local skills needed for Lipcoding.

## Inputs

- Current contest repository path.
- Source preparation workspace, normally `D:\KLab\workspace\2026-립코딩-MS`.
- Available VS Code Copilot Agent mode.
- Available Copilot CLI MCP servers, if needed.

## Procedure

1. Confirm the current folder is the contest repository root.
2. Create `.github/` if missing.
3. Copy or create `.github/copilot-instructions.md`.
4. Copy or create the prepared skills in `.github/skills/`.
5. Confirm `.github/copilot-instructions.md` includes the known top-level rules: personal productivity web app, Copilot SDK required, Azure deployment required, and no fixed app before topic reveal.
6. Keep only contest-useful skills:
   - `lipcoding-wiki-graph`
   - `lipcoding-verify`
   - `lipcoding-customization-setup`
   - `lipcoding-azure-deploy`
   - `lipcoding-git-hygiene`
   - `lipcoding-loop`
   - `lipcoding-devils-debate`
   - `lipcoding-design-director`
   - `lipcoding-warm-editorial-ui`
7. Do not add hooks, custom agents, plugins, or new global skills unless official contest rules require them.
8. In VS Code, open Chat in Agent mode and run `/skills`.
9. Verify that the nine Lipcoding skills are visible.
10. Ask Copilot to summarize active workspace instructions and available skills.
11. If a skill is missing, check:
    - folder path is `.github/skills/<skill-name>/SKILL.md`
    - `name` matches the folder name
    - name uses only lowercase letters, numbers, and hyphens
    - VS Code opened the repository root, not a subfolder

## Verification Prompt

Use this prompt in VS Code Agent mode:

```text
이 workspace의 .github/copilot-instructions.md와 .github/skills 아래 Lipcoding skills를 확인해줘. 어떤 지침과 skills가 활성화될 수 있는지 요약하고, 누락된 설정이 있으면 Green Amber Red로 분류해줘.
```

## Rules

- Prefer workspace-local customizations over global installs.
- Do not install third-party skill packs during the contest.
- Do not rely on Docker-based MCP unless Docker has passed smoke.
- If VS Code does not see parent-repo customizations, open the repo root directly.
- Treat MCP as ready only after one real tool call succeeds.
