# rcrt-template-chatbot

> Agent-facing guide. Read this before editing any file in this template.

## What This Template Does

A full-screen chat interface connected to an RCRT agent via SSE streaming. Includes session list, message history, and agent switching. Use for chat-first applications: AI assistants, customer support, Q&A tools, conversational agents.

## Rules
- NEVER rewrite the chat component — it is pre-built in src/components/chat/
- NEVER modify auth.tsx — the template has correct auth out of the box
- NEVER add custom SSE logic — use the pre-built useChat hook

## Pre-Built — Do Not Reimplement

| What | Import | Usage |
|---|---|---|
| ChatInterface | src/components/chat/ChatInterface.tsx | `<ChatInterface agentId="my-agent" />` |
| useChat | src/hooks/useChat.ts | const { messages, sendMessage, isStreaming } = useChat(agentId) |
| SessionList | src/components/chat/SessionList.tsx | `<SessionList onSelect={setSession} />` |
| MessageBubble | src/components/chat/MessageBubble.tsx | Used inside ChatInterface — rarely need directly |
| RcrtClient | src/lib/api-client.ts | const client = getRcrtClient() |

## File Structure

```
src/
  App.tsx                    ← CONFIG: add routes here
  pages/
    ChatPage.tsx             ← TOUCH: your main chat page
    SettingsPage.tsx         ← TOUCH: optional settings
  components/
    chat/                    ← LEAVE: ChatInterface, SessionList, MessageBubble
    layout/                  ← LEAVE: AppLayout, nav
  hooks/
    useChat.ts               ← LEAVE: SSE + session management
  lib/
    api-client.ts            ← LEAVE: RcrtClient singleton
    auth.tsx                 ← LEAVE: DO NOT MODIFY
```

## Adding a New Page

1. Create `src/pages/MyPage.tsx`
2. Add `<Route path="/my-page" element={<MyPage />} />` in App.tsx
3. Add nav item in `src/components/layout/AppLayout.tsx`

## Connecting to an Agent

```tsx
import { ChatInterface } from '../components/chat/ChatInterface';

export function MyChat() {
  return <ChatInterface agentId="my-rcrt-agent" sessionId={sessionId} />;
}
```

## Common Patterns

### Pattern 1: Multiple agents on different pages
Create separate pages, each with a different `agentId` prop on ChatInterface.

### Pattern 2: Sidebar with context
Add a right panel next to ChatInterface with breadcrumb data relevant to the conversation:
```tsx
<div style={{display:'flex'}}>
  <ChatInterface agentId="chat" />
  <ContextPanel breadcrumbTags={['type:contact', 'session:active']} />
</div>
```

### Pattern 3: Pre-loaded knowledge
Pass initial system context to the agent via a breadcrumb created before starting the session.
