---
name: lipcoding-azure-deploy
description: Plan, execute, and verify the safest Azure deployment path for a Lipcoding contest web app, including Copilot SDK configuration and public URL smoke evidence. Use when choosing between azd, Azure App Service, Static Web Apps, GitHub Copilot for Azure, Azure MCP tools, or CLI fallback; when preparing Azure smoke evidence; or when deployment is a contest bottleneck.
---

# Lipcoding Azure Deploy

Use this skill before any Azure deployment action.

This skill keeps deployment simple, observable, and reversible. It treats GitHub Copilot for Azure and Azure MCP as helpers, not as the only deployment path.

## Deployment Principle

- Prefer one boring deploy path that can be smoke-tested quickly.
- Azure cloud deployment is mandatory for submission.
- Do not invent cloud architecture during the contest.
- Do not deploy secrets or local auth state.
- Keep Copilot SDK configuration explicit, minimal, and secret-safe.
- Do not depend on MCP if the same deployment can be done by `azd` or `az`.
- Ask Copilot for a plan first; authorize execution only after reviewing the resource group, region, SKU, expected cost, and commands.

## Path Selection

| App shape | Primary path | Fallback path | Avoid |
| --- | --- | --- | --- |
| React/Vite static only | Azure Static Web Apps or App Service static build | `az staticwebapp` CLI | backend container work |
| Node/Express full web app | Azure App Service via `az webapp up` | VS Code Azure App Service extension | Docker if not already smoked |
| React + API from azd template | `azd up`, then `azd deploy` | `azd provision` + `azd deploy` | modifying infra late |
| Python/FastAPI | App Service or Container Apps only if template exists | simplest server-rendered/Node fallback | custom container under time pressure |
| Unknown stack after 15:30 | App Service simplest route | static export if possible | new database/auth/cloud service |

## P0 Commands To Know

Use these manually or through Copilot/Copilot CLI, depending on contest input rules:

```powershell
az account show -o table
az account set --subscription "<subscription-name-or-id>"
azd auth login --check-status
azd up
azd deploy
az webapp up --sku F1 --name <globally-unique-app-name>
az webapp up --sku F1 --name <globally-unique-app-name> --os-type Windows
```

## VS Code / Copilot For Azure Prompt Rules

- Include the word `Azure` in prompts so Azure tools are selected.
- Use Agent mode for multi-step deployment tasks.
- Ask for a checklist plan before allowing resource creation.
- Require the plan to name resource group, region, SKU, app service/static web app, env vars, command, and smoke URL.
- Do not let Copilot read, print, or store secrets unless explicitly needed.
- If a tool asks for confirmation to access sensitive data, deny unless it is required for the current deployment.

## Azure MCP Use

Use Azure MCP for:

- checking current Azure account/subscription
- listing resource groups
- finding deployed app URL
- checking App Service or Static Web App state
- troubleshooting a failed deployment
- generating or explaining Azure CLI commands

Do not depend on Azure MCP for:

- first-time deployment if CLI path is clearer
- secret retrieval
- destructive cleanup during contest time
- broad resource exploration when time is short

## Deployment Loop

1. Confirm local smoke passes.
2. Confirm `.gitignore` excludes `.env`, `.azure`, `.azd/.env`, build artifacts, and secrets.
3. Confirm Copilot SDK environment variables, permissions, or public-client assumptions are documented without exposing secrets.
4. Choose one deployment path.
5. Ask Copilot for a step-by-step Azure plan and stop before execution.
6. Review resource group, region, SKU, cost, Copilot SDK config, and commands.
7. Execute the smallest deploy command.
8. Capture the deployed URL.
9. Run browser smoke and Copilot SDK feature smoke against the deployed URL.
10. Record evidence: command, URL, timestamp, PASS/FAIL.
11. If deploy fails for 20 minutes, shrink the app or change path.

## Time Rules

| Time | Rule |
| --- | --- |
| 10:30~11:30 | Smoke `az`, `azd`, Copilot for Azure, and Azure MCP. Do not wait until 15:30. |
| 13:00~15:00 | Keep app deployable. Avoid dependencies that need cloud setup. |
| 15:00 | First deploy attempt should start if no Azure URL exists. |
| 15:30 | Deployment and submission hardening outrank features. |
| 16:00 | No new features, no new Azure services, no infra redesign. |
| 16:00~16:30 | Only fix submission-blocking deploy issues. |

## Failure Fallbacks

| Failure | Immediate fallback |
| --- | --- |
| `azd up` fails on template/infra | Use `az webapp up` for Node/Express app. |
| App Service cannot detect runtime | Verify root folder, `package.json`, start script, and `PORT`. |
| Static Web App workflow slow | Use App Service if direct deploy is faster. |
| Region/resource unavailable | Retry one known good region; do not debug quotas for long. |
| External API/env secrets block deploy | Replace with seed/mock mode. |
| Azure MCP missing in VS Code | Use `az`/`azd` CLI and Copilot explanation only. |
| Deployed URL 500 | Check logs briefly, then simplify start command/data/env. |
| 20 minutes lost | Freeze features and submit simplest working URL. |

## Output Format

Return exactly:

```markdown
## Azure Deploy State
- App shape:
- Current time:
- Local smoke:
- Copilot SDK config/smoke:
- Azure account/subscription:

## Recommended Path
- Primary:
- Fallback:
- Why:

## Plan Before Execution
| Step | Command/tool | Expected evidence | Risk |
| --- | --- | --- | --- |

## Do Not Do
- ...

## Smoke Evidence
| Check | Evidence | Status |
| --- | --- | --- |

## Decision
- Execute / fix local / fallback / freeze:
```

## Verification Prompt

```text
lipcoding-azure-deploy 스킬을 사용해. 현재 앱을 Azure에 배포하기 위한 가장 안전한 경로를 골라줘. 먼저 local smoke, Copilot SDK config/smoke, app shape, 구독, 리소스 그룹, region, SKU, 예상 명령, 비용/secret 위험, fallback을 표로 내고, 내가 승인하기 전에는 Azure 리소스를 만들거나 변경하지 마.
```
