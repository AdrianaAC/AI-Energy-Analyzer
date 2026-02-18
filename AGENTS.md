# AGENTS.md

Project-level guidance for AI coding agents working in this repository.

## Scope

This file applies to the whole repository.

## Project Summary

- App: Energy Intelligence Dashboard
- Stack: Next.js App Router + TypeScript + TailwindCSS v4
- API route: `app/api/agent/route.ts`
- Deterministic logic: `lib/energy-tools.ts`
- Tests: Vitest (`npm test`)

## Goals

- Keep the user workflow simple: upload data, run analysis, inspect tool proof.
- Preserve deterministic calculations for anomaly detection.
- Keep email drafting optional and only for explicit email intent.
- Maintain transparent outputs (final answer + tool outputs).

## Coding Rules

- Use TypeScript with strict, clear types.
- Prefer small, focused changes over large rewrites.
- Keep deterministic business logic in `lib/energy-tools.ts`.
- Keep orchestration and prompting in `app/api/agent/route.ts`.
- Avoid introducing hidden side effects in UI components.
- Do not add secrets or hard-coded API keys.

## Validation Before Handover

Run these commands after significant changes:

```bash
npm run lint
npm test
npm run build
```

## API and Tooling Constraints

- Any new tool should be deterministic where possible.
- Validate external inputs with Zod at API boundaries.
- Preserve the JSON response contract:
  - `toolsUsed`
  - `toolOutputs`
  - `finalText`

## UI Constraints

- Keep responsive behavior intact for mobile and desktop.
- Preserve the sectioned results structure in the right panel.
- Do not show draft email UI unless an email draft exists in tool outputs.

## Documentation

When behavior changes, update:

- `README.md` (setup, workflow, architecture)
- Test coverage for deterministic logic
