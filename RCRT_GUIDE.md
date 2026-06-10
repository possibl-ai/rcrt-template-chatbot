# rcrt-template-chatbot — Agent Guide

> Guide for AI coding agents working in this repo. Generated from the
> code-studio knowledge base — matches the actual source in this template.

## What This Template Does

A full-screen chat app connected to an RCRT agent: user messages go out via
`client.sendChat(text, sessionId)`, assistant replies stream back over SSE
(`client.connectEvents`) filtered by the `session:{id}` tag. Session history,
settings page, responsive layout. Use for chat-first apps: assistants,
support bots, Q&A tools.

## Actual File Structure (verified against the repo)

```
src/
  App.tsx                          routes: / and /session/:id → ChatPage, /sessions, /settings
  pages/
    ChatPage.tsx                   ← the WHOLE chat UI is inline here. Edit directly.
    SessionsPage.tsx               session list via client.getSessions()
    SettingsPage.tsx               placeholder settings
  components/layout/AppLayout.tsx  sidebar/bottom nav (add nav items here)
  lib/
    api-client.ts  auth.tsx  rcrt-api.ts  store.ts (zustand: sessionId + messages)  utils.ts (cn)
```

There is NO `src/components/chat/`, NO `useChat` hook, NO ChatInterface
component. The message list, input box, and SSE wiring are all inline in
`ChatPage.tsx` (~130 lines) — restyle or extend it in place.

## The RCRT client (vendored — NOT an npm package)

Every template vendors its client at `src/lib/rcrt-api.ts` and exposes a
singleton via `src/lib/api-client.ts`:

```ts
import { getClient } from '../lib/api-client';
const client = getClient();
```

Real method signatures (use these EXACTLY — `queryBreadcrumbs` takes
positional args, not an options object):

```ts
queryBreadcrumbs(tags: string[], limit = 100): Promise<Breadcrumb[]>
createBreadcrumb({ name?, title?, tags?, content?, upsert? }): Promise<Breadcrumb>
getBreadcrumb(id): Promise<Breadcrumb>
updateBreadcrumb(id, { title?, content?, tags?, version }): Promise<Breadcrumb>  // version REQUIRED
deleteBreadcrumb(id): Promise<void>
sendChat(message, sessionId?): Promise<{ id, session_id }>   // reply arrives via SSE, not the response
getSessions(limit = 30) / getSessionMessages(sessionId, limit = 100)
uploadFile(file) / getFileDownloadUrl(fileId) / getFileText(fileId)
connectEvents(onEvent): () => void   // SSE: onEvent({ type: 'breadcrumb', data }) — returns disconnect fn
resolveService(name)
```

Realtime pattern (the ONLY supported way — never hand-roll EventSource):

```tsx
useEffect(() => {
  const disconnect = getClient().connectEvents(({ type, data }) => {
    if (type !== 'breadcrumb') return;
    const event = data as any;
    const tags: string[] = event.tags || [];
    // filter by your tags, e.g. tags.includes(`session:${sessionId}`)
  });
  return disconnect;
}, [deps]);
```

DO NOT import `@possibl/rcrt-api` or `@possibl/rcrt-ui` — they are NOT in
package.json. Use the vendored client and build UI with Tailwind + lucide-react.

## Hard rules

- `npm run build` runs `tsc && vite build` — your code MUST typecheck or the
  Cloud Run deploy fails. No `any`-typed imports of nonexistent modules.
- NEVER modify `src/lib/rcrt-api.ts`, `src/lib/api-client.ts`, or
  `src/lib/auth.tsx` — auth + client are correct out of the box.
- NEVER add a database, REST API layer, or custom auth. Data is breadcrumbs.
- New deps: edit package.json only when truly needed; prefer what's installed
  (react-router-dom v7, zustand, lucide-react, tailwind, clsx/tailwind-merge via `cn()`).

## Adding a page

1. Create `src/pages/MyPage.tsx` (default export).
2. Add `<Route path="/my-page" element={<MyPage />} />` inside the layout route in `src/App.tsx`.
3. Add a nav item in `src/components/layout/AppLayout.tsx`.

## Env (.env — injected automatically by `project init-repo` and the preview)

`VITE_API_URL`, `VITE_TENANT_ID`, `VITE_RCRT_PREVIEW_TOKEN` (preview auth),
optional `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` /
`VITE_FIREBASE_PROJECT_ID` (production auth). `src/lib/auth.tsx` picks
Firebase when `VITE_FIREBASE_API_KEY` is set, else falls back to the preview
token. Styling: Tailwind design tokens in `src/index.css` (`--primary`,
`--background`, ...) — change theme there.

## Common patterns

- **Point at your agent**: `sendChat` talks to the workspace's default chat
  agent. Create your in-app agent with the `agent` tool and make it the
  default (tag `interface:chat-default`), or extend `sendChat` usage if the
  backend exposes agent routing.
- **Seed FAQ/knowledge**: store domain knowledge as `knowledge` breadcrumbs in
  the workspace; the agent (not the frontend) reads them.
- **Branding**: index.css tokens + the empty-state copy in ChatPage.
