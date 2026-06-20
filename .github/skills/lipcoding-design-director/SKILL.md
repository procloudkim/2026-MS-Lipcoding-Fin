---
name: lipcoding-design-director
description: Derive a frontend design direction for a Lipcoding personal productivity web app from MAS outputs, Devil's Debate results, LLM-Wiki notes, graph trace, Copilot SDK requirements, or PLANS.md. Use before UI implementation when the app concept, persona, workflow, or vertical slice must be translated into a Korean-first Warm Editorial product interface direction.
---

# Lipcoding Design Director

Use this skill after concept debate and before UI implementation.

This skill does not implement components. It turns the MAS plan into a focused frontend direction that `lipcoding-warm-editorial-ui` can implement.

## Inputs

- Official task text.
- Known top-level rules: personal productivity web app, Copilot SDK required, Azure cloud deployment required.
- `lipcoding-devils-debate` output, if available.
- LLM-Wiki sections: Problem, Users, Features, Risks, Decisions, Open Questions.
- Graph trace: requirement -> feature -> Copilot SDK/API/data/screen -> smoke -> Azure deploy.
- Current vertical slice from `lipcoding-loop` or PLANS.
- Time remaining.

## Design Thesis

Default visual reference:

- Agency-grade Warm Editorial.
- Warm beige base, ink text, restrained gray borders, exactly one red accent.
- Pretendard Variable.
- 100% Korean copy.
- Desktop-first and fully responsive.
- Personal productivity web app, with the concrete topic supplied after the official reveal.

Adapt the reference to the app concept instead of repeating it mechanically. A productivity app for focus, review, planning, capture, habit, or decision support should have a different screen hierarchy and interaction rhythm.

## Procedure

1. Extract the product concept from the MAS artifacts:
   - target persona
   - main productivity pain
   - core job-to-be-done
   - selected vertical slice
   - Copilot SDK-powered behavior or surface
   - must-test behavior
   - deferred moonshot or risky feature
2. Choose one product metaphor:
   - `editorial-desk`: planning, writing, thinking, review.
   - `command-center`: dashboard, queue, triage, execution.
   - `focus-studio`: deep work, timer, distraction control.
   - `decision-room`: comparison, debate, scoring, tradeoffs.
   - `personal-ops`: routine, habit, calendar, checklist.
3. Translate the metaphor into UI direction:
   - first screen state
   - navigation model
   - information density
   - primary action placement
   - data visualization level
   - empty/loading/error/success states
4. Lock the design rules:
   - Korean copy must be concrete, not placeholder text.
   - First viewport must be an app surface, not a marketing hero.
   - If Copilot SDK behavior is user-facing, show it as part of the real productivity workflow.
   - Keep red accent for one semantic purpose.
   - Do not add decorative gradients, blobs, or fake stock sections.
   - Show the selected vertical slice above the fold.
5. Produce a handoff prompt for `lipcoding-warm-editorial-ui`.

## Product Metaphor Selection

| MAS signal | Prefer metaphor | UI implication |
| --- | --- | --- |
| many tasks, priorities, status | `command-center` | dense dashboard, queue, filters, status chips |
| writing, summarizing, planning | `editorial-desk` | split editor/review layout, notes, outline, version history |
| timer, attention, personal rhythm | `focus-studio` | calm center panel, session state, minimal nav |
| compare choices or argue tradeoffs | `decision-room` | columns, criteria, scorecards, debate trail |
| habits, calendar, recurring actions | `personal-ops` | today view, streaks, schedule, quick capture |

If two metaphors compete, choose the one that best supports the smallest vertical slice, and record the rejected metaphor as `DEFER`.

## Output Format

Return exactly these sections:

```markdown
## Design Direction State
- Source artifacts used:
- Selected vertical slice:
- Time risk:

## Product Metaphor
- Chosen metaphor:
- Why this fits the MAS decision:
- Rejected metaphor:
- Rejection reason:

## Korean Product Surface
- App name candidate:
- One-line promise:
- Primary user:
- Main screen:
- Primary action:
- Secondary actions:
- Copilot SDK surface:

## Screen Direction
| Screen / region | Purpose | Key Korean copy | Component pattern |
| --- | --- | --- | --- |

## Visual System
| Token | Direction |
| --- | --- |
| Font | Pretendard Variable |
| Base | Warm beige |
| Text | Ink |
| Accent | Single red semantic use |
| Radius | 8px or less |
| Density | Desktop-first productivity density |

## UX States
| State | Korean copy / behavior |
| --- | --- |
| Empty | |
| Loading | |
| Error | |
| Success | |

## Design Graph Updates
| Source | Edge | Target | Confidence |
| --- | --- | --- | --- |

## Handoff Prompt
Use lipcoding-warm-editorial-ui to implement:
```

## Rules

- Keep this skill atomic: do not write code.
- Do not create a landing page unless the official task asks for one.
- Do not invent app features that were not kept by MAS unless marked `DEFER`.
- Do not design a fake Copilot SDK panel; it must support a kept workflow or be cut.
- If the design direction conflicts with a Devil's Advocate unresolved risk, fix or cut the design idea first.
- If the design has no smoke-testable interaction, simplify it.
- If time remaining is under 90 minutes, skip optional polish and only specify the main screen plus primary action.
