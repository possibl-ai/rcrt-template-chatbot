# Instructions for AI coding agents

Read this first. It supersedes any general guidance you have about React or web frameworks.

## What this codebase is

This is an RCRT web app scaffolded from a `rcrt-template-*` repo. The app is a **client** that talks to the RCRT api-gateway (HTTP + SSE). It is **not** a server. It does not own the data — everything persists as RCRT breadcrumbs.

## Before you write code

1. Read **RCRT_GUIDE.md** at the repo root — it lists pre-built components you must not reimplement.
2. Use `think` to load the matching `knowledge-template-*` doc if you are running inside Code Studio.
3. Never add a database, custom REST API, or bespoke auth — RCRT primitives only.

## Rules

- NEVER modify `src/lib/auth.tsx` unless the user explicitly asks.
- NEVER hardcode API keys in source — use `.env` (`VITE_*`).
- ALWAYS use the pre-built RcrtClient (`src/lib/api-client.ts`).
- ALWAYS call `registerDefaultWidgets()` at startup when using `@possibl/rcrt-ui`.
