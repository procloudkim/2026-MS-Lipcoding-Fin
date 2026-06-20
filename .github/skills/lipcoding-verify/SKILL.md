---
name: lipcoding-verify
description: Run the final Lipcoding verification loop before submission, including personal productivity app scope, Copilot SDK behavior, and Azure public URL smoke.
---

# Lipcoding Verify

Use this skill before submission and after every meaningful vertical slice.

## Verification Order

1. Read the current run instructions.
2. Confirm the app matches the revealed topic and remains a personal productivity web app.
3. Start the app locally.
4. Run backend/API smoke.
5. Run browser smoke.
6. Run Copilot SDK behavior smoke.
7. Check required environment variables without printing secrets.
8. Deploy or verify deployment on Azure.
9. Smoke-test the public URL, including the Copilot SDK path if user-visible.
10. Check submission fields.

## Evidence To Report

For each check, report:

- command or URL
- pass/fail
- exact error if failed
- next smallest fix

## Minimum Smoke

The app is not ready unless:

- the main page loads
- the primary user action works
- the Copilot SDK-powered behavior works or reports a clear recoverable configuration error
- data persists or state updates as intended
- the deployed URL opens
- README/run command matches reality

## Stop Rules

- After 16:30 KST, do not add features.
- If Azure deployment fails for more than 20 minutes, shrink to the simplest deployable shape.
- Do not hide failing tests or broken routes.
