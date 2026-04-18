# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 16 App Router application. All routes live under `app/`.

### Data flow

1. `lib/cases.ts` — Single source of truth for all simulation cases. Each case defines:
   - `systemPrompt`: The AI patient persona and behavioral instructions fed to Claude
   - `evaluationTypes`: Which evaluations run after the chat (drives both UI and API prompts)
   - `category`: `"mse" | "admit" | "nursing"` — controls whether the MSE form appears in evaluation

2. `app/chat/[caseId]/page.tsx` → `app/api/chat/route.ts` — Streaming chat with the AI patient. The full message history is sent on every turn. Session ends by navigating to `/evaluate/[caseId]?session=<JSON>`.

3. `app/evaluate/[caseId]/page.tsx` → `app/api/evaluate/route.ts` — Post-chat evaluation. MSE cases show a form for students to write their assessment first; all cases then call the evaluate API once per `evaluationTypes` entry. Results stream in sequentially.

### Key conventions

- Chat messages are passed to the evaluate page via URL query string (`?session=...`). For long conversations this URL can become very large.
- The evaluate API receives `evaluationType` and dispatches to a different prompt per type: `mse`, `communication`, `procedure`, `intervention`, `injection`.
- `nursing-2` is the only case where the AI patient proactively asks the student to report non-verbal nursing actions mid-conversation.
- `nursing-4` has a staged acceptance arc (strong refusal → conditional acceptance) encoded in its `systemPrompt`.

## Next.js 16 Breaking Changes to Know

- `cookies()`, `headers()`, `draftMode()`, and route `params` are **async only** — must be `await`ed
- `middleware.ts` is renamed to `proxy.ts`; the `edge` runtime is no longer supported in proxy
- `revalidateTag()` now requires a second `cacheLife` argument
