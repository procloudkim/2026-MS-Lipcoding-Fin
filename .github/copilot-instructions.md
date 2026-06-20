# Lipcoding 2026 Copilot Instructions

Use these instructions for the 2026 Lipcoding contest workspace.

## Priority

1. Follow the official contest rules and the task revealed on event day.
2. Keep the solution small, deployable to Azure, and easy to verify.
3. Prefer Copilot-native workflow: VS Code, Copilot Chat, Copilot CLI, MCP tools, and OS dictation fallback.
4. Do not assume 2025 rules still apply unless the 2026 task says so.

## Known Top-Level Rules

- App category: personal productivity improvement web app.
- Detailed topic: not yet announced. Wait for the user to enter the revealed topic before selecting the concrete product concept or building app features.
- Required technology: the implemented app must use the Copilot SDK in a real, traceable product feature.
- Required deployment: the app must be deployed to Azure cloud and verified through a public URL smoke check.

## Operating Loop

Before implementation:

1. Wait for the user to enter the revealed topic, then capture it in `prep/llm-wiki/00-event-brief.md`.
2. Separate verified facts, inferences, unknowns, constraints, and success criteria.
3. Record how the solution remains a personal productivity web app.
4. Build a trace graph connecting requirement -> Copilot SDK use -> route -> API -> data -> test -> Azure deploy.
5. Pick the smallest vertical slice that can pass local smoke while preserving the Copilot SDK and Azure deployment path.

During implementation:

1. Make one small change at a time.
2. Run the smallest relevant test or smoke check after each feature.
3. Keep APIs, routes, environment variables, and run commands documented.
4. Keep the Copilot SDK integration connected to a real user workflow, not a fake demo surface.
5. Do not add a feature unless its trace graph edge to a test or smoke check is clear.

Before submission:

1. Run local API smoke.
2. Run browser smoke.
3. Run Copilot SDK integration smoke.
4. Run Azure deployment smoke.
5. Verify submission fields, run command, repo URL, and deployment URL.

## Hard Stops

- After 16:30 KST, do not add new features.
- Do not commit secrets, tokens, personal keys, or Azure credentials.
- Do not rely on company GitHub or company Azure accounts.
- Do not introduce a vector database, GraphRAG engine, or custom memory system unless the task explicitly requires it.
- Do not treat generated code as correct until it runs.
- Do not use Docker-only MCP paths unless Docker has already passed smoke.
- Do not build a fixed app concept before the user enters the revealed topic.
- Do not accept an MVP plan that omits Copilot SDK usage or Azure cloud deployment.
- Do not fake Copilot SDK usage with static UI copy or unused dependencies.

## Preferred Stack Bias

If the contest rules allow free choice and no better fit is revealed:

- App: personal productivity improvement web app.
- Frontend: React + Vite or a simple server-rendered UI.
- Backend: FastAPI or Node/Express.
- Data: SQLite or in-memory with clear seed data, depending on time.
- Copilot SDK: smallest official SDK integration that directly supports the revealed productivity workflow.
- API docs: OpenAPI/Swagger when using FastAPI or documented REST routes otherwise.
- Deploy: Azure path that can be completed and smoke-tested within the available time.

## LLM-Wiki / Graph Use

Use LLM-Wiki and graphification as planning tools, not as app architecture by default.

- Wiki pages capture stable knowledge.
- Trace graphs expose missing links.
- Error Book records failed assumptions and fixes.
- The final app should remain simple unless the revealed task demands otherwise.
