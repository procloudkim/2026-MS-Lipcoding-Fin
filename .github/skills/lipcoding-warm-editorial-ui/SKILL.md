---
name: lipcoding-warm-editorial-ui
description: Apply the Lipcoding Warm Editorial frontend design system to a Korean personal productivity web app with real Copilot SDK workflow affordances. Use when building, revising, or reviewing UI for the contest, especially React/Vite/Tailwind/shadcn interfaces that must feel agency-grade, Korean-first, desktop-first, and fully responsive.
---

# Lipcoding Warm Editorial UI

Use this skill to make the contest app look deliberate without slowing delivery. If the MAS concept or screen direction is not settled, use `lipcoding-design-director` first.

## Design Contract

- Language: 100% Korean UI copy.
- Product: personal productivity improvement web app; concrete topic comes from the official reveal.
- Tone: quiet, editorial, premium, productivity-focused.
- Layout: desktop-first, fully responsive down to 375px width.
- Palette: warm beige base, ink text, restrained gray borders, exactly one red accent.
- Typography: Pretendard Variable first; fall back to Korean-safe system fonts.
- Shape: use 8px radius or less unless a component requires otherwise.
- Density: avoid marketing-page emptiness; the first screen must show useful app state.
- Copilot SDK: any SDK-powered UI must be connected to the primary workflow, with loading, error, and success states.
- Motion: subtle only; no heavy scroll narratives before the core app works.

## Preferred Stack

- React + Vite.
- Tailwind CSS for layout and tokens.
- shadcn/ui for buttons, inputs, dialogs, tabs, tables, cards, forms, and popovers.
- lucide-react for icons.
- Pretendard via local package or CDN.
- Copilot SDK integration surface only where it supports the kept productivity workflow.

## Visual Rules

- Use beige as a background, not as the whole palette. Keep ink contrast strong.
- Use the red accent only for primary action, current state, or critical warning.
- Build real app surfaces first: dashboard, editor, task list, calendar, review queue, analytics, settings.
- Use cards only for repeated items or framed tools. Do not nest cards inside cards.
- Do not add decorative blobs, random gradients, or stock-looking hero sections.
- Do not hide core actions below the fold on desktop.
- Make Korean text fit: no clipping, no overlap, no viewport-scaled font sizes.
- Prefer icons plus labels for clear commands; icon-only controls need tooltip text.
- Do not fake Copilot SDK behavior with static assistant-looking copy.

## Component Pattern

For each screen, define:

1. Primary user job.
2. Main state shown above the fold.
3. Primary action and secondary actions.
4. Empty, loading, error, and success states.
5. Desktop, tablet, and mobile layout behavior.

## Prompt Template

```text
lipcoding-warm-editorial-ui 스킬을 사용해.
이 앱은 개인 생산성 향상 앱이다.
디자인 방향은 에이전시급 Warm Editorial: 베이지 배경, 잉크 텍스트, 단일 레드 액센트, Pretendard, 100% 한국어, 데스크톱 우선, 완전 반응형이다.
React/Vite/Tailwind/shadcn/lucide 기준으로 실제 사용 가능한 앱 화면을 구현해.
Copilot SDK를 사용하는 기능은 실제 생산성 워크플로우에 연결하고 loading/error/success 상태를 보여줘.
첫 화면은 랜딩 페이지가 아니라 사용자가 바로 작업할 수 있는 생산성 앱 화면이어야 한다.
375px, 768px, 1280px, 1920px에서 텍스트 겹침/잘림/오버플로우가 없도록 구성해.
```

## QA Checklist

- Korean copy is complete and natural.
- Primary workflow is visible without explanation text.
- Layout works at 375, 768, 1280, and 1920 widths.
- Text does not clip or overlap.
- Contrast is readable on beige background.
- Red accent is used sparingly and consistently.
- Copilot SDK-powered interaction has visible loading, error, and success states.
- Buttons, inputs, tabs, dialogs, and menus have focus states.
- Browser smoke and screenshot review pass before submission.
