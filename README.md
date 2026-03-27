# RCRT Template: Chatbot

Minimal chat interface powered by RCRT. Use this as a starting template for any RCRT-backed application.

## What's Included

- React 18 + Vite + TypeScript + Tailwind CSS
- `@rcrt/api` client pre-configured
- Firebase authentication (Google sign-in)
- Responsive layout (sidebar on desktop, bottom nav on mobile)
- Chat page with SSE streaming
- Session history page
- Settings page
- Dockerfile + Cloud Build config for Cloud Run deploy

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your RCRT API URL and Firebase config

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your RCRT API Gateway URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_RCRT_PREVIEW_TOKEN` | Preview token (for WebContainer preview) |

## Project Structure

```
src/
  App.tsx                    — Routing + auth wrapper
  main.tsx                   — Entry point
  index.css                  — Tailwind + design tokens
  pages/
    ChatPage.tsx             — Chat interface with SSE
    SessionsPage.tsx         — Session history
    SettingsPage.tsx         — Account settings
  components/
    layout/
      AppLayout.tsx          — Responsive shell (sidebar + bottom nav)
  lib/
    api-client.ts            — RcrtClient singleton
    auth.tsx                 — Firebase auth gate
    store.ts                 — Zustand state
    utils.ts                 — cn() helper
```

## Customizing

- **Add a page**: Create `src/pages/MyPage.tsx` → add Route in `App.tsx` → add nav item in `AppLayout.tsx`
- **Change theme**: Edit CSS variables in `src/index.css`
- **Change agent**: The chat connects to whatever agent is the `interface:chat-default` in your workspace
- **Add data views**: Query breadcrumbs by tags using `getClient().queryBreadcrumbs()`

## Deploy

Push to main triggers Cloud Build → Cloud Run (if `cloudbuild.yaml` is configured).

## Built with RCRT

This template is designed for [RCRT Code Studio](https://github.com/possibl-ai/rcrt-v2). RCRT is the backend — all state lives in breadcrumbs, all AI runs through agents, all external APIs connect through services.
