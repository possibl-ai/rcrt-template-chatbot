# Instructions for AI coding agents

Read this first. It supersedes general guidance about the framework you may have.

## What this codebase is

This is an RCRT app scaffolded from one of the public templates. The app is a **client** that talks to the RCRT api-gateway (HTTP + SSE). Every piece of state is a breadcrumb in RCRT — see [`packages/docs/AGENTS.md`](https://github.com/possibl-ai/rcrt-v2/blob/development/packages/docs/AGENTS.md) and [`packages/docs/concepts/02-primitives.md`](https://github.com/possibl-ai/rcrt-v2/blob/development/packages/docs/concepts/02-primitives.md).

When previewed inside the **RCRT preview-service** (`https://rcrt-preview-service-jv46xfmdia-uc.a.run.app`), an extra `<script>` is injected into `index.html` at WebContainer mount time. That script gives the preview chrome console capture, screen detection, and the comments feature.

## Hard rules (do NOT change these)

1. **Do not add a file that wraps `console.*` and posts to `window.parent`** (often called a "preview shim"). The preview-service injects its own at mount time. Adding your own would double-wrap console methods.
2. **Do not add `postMessage` listeners that consume `rcrt-preview-*` types** other than `rcrt-preview-host-navigate`. Those types are reserved for the host↔guest protocol.
3. **Do not commit a real `.env`** (commit only `.env.example`). The preview-service overwrites the four managed `VITE_*` keys at boot from URL hash params.
4. **Do not hardcode `VITE_API_URL` / `VITE_RCRT_PREVIEW_TOKEN` / `VITE_TENANT_ID` / `VITE_GOOGLE_MAPS_API_KEY`.** They MUST come from `import.meta.env.*`.

## Soft rules (conventions; agent free to evolve)

- Talk to the api-gateway via the SDK (or the project's wrapper), not raw `fetch()`. The SDK handles auth refresh, retries, and SSE reconnection.
- Cards (interactive UI emitted by RCRT agents) resolve via `PATCH /v1/breadcrumbs/{id}` with a `content.status` and optional `content.user_response`. Don't invent custom action endpoints.
- Use the project's theme tokens / design system instead of inlining colors and font sizes.

## When in doubt

Read [`packages/docs/AGENTS.md`](https://github.com/possibl-ai/rcrt-v2/blob/development/packages/docs/AGENTS.md) and [`packages/docs/operations/preview-service-integration.md`](https://github.com/possibl-ai/rcrt-v2/blob/development/packages/docs/operations/preview-service-integration.md) (when published) for the broader contract.
