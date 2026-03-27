import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getClient } from '../lib/api-client';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

export default function ChatPage() {
  const { id: routeSessionId } = useParams();
  const { sessionId, setSessionId, messages, addMessage, clearMessages } = useStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeSession = routeSessionId || sessionId;

  useEffect(() => {
    if (routeSessionId && routeSessionId !== sessionId) {
      setSessionId(routeSessionId);
      clearMessages();
    }
  }, [routeSessionId]);

  useEffect(() => {
    if (!activeSession) return;

    const client = getClient();
    const settings = client.getSettings();
    const apiUrl = settings.apiUrl as string;
    const tenantId = settings.tenantId as string;

    let token: string | null = null;
    client.request<{ user: unknown }>('/v1/auth/me').then(() => {
      // token refreshed by adapter
    }).catch(() => {});

    const buildEventSource = async () => {
      const adapter = (client as any).adapter;
      token = await adapter?.getToken?.();
      if (!token) return null;

      const params = new URLSearchParams();
      params.set('token', token);
      if (tenantId) params.set('tenant_id', tenantId);

      const es = new EventSource(`${apiUrl}/v1/events?${params}`);
      es.addEventListener('breadcrumb', (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data);
          const tags = event.tags || [];
          if (tags.some((t: string) => t === `session:${activeSession}`)) {
            if (tags.includes('llm-section:conversation') && event.created_by?.type !== 'user') {
              addMessage({
                role: 'assistant',
                content: event.content?.content || event.content?.message || event.title || '',
                id: event.breadcrumb_id,
              });
            }
          }
        } catch {}
      });
      return es;
    };

    let es: EventSource | null = null;
    buildEventSource().then((source) => { es = source; });

    return () => { es?.close(); };
  }, [activeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    addMessage({ role: 'user', content: text });

    try {
      const client = getClient();
      const result = await client.sendChat(text, activeSession || undefined);
      if (result.session_id && !activeSession) {
        setSessionId(result.session_id);
      }
    } catch (err: any) {
      addMessage({ role: 'system', content: `Error: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4 pb-20 md:pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-2xl font-bold text-foreground">What can I help you build?</p>
            <p className="text-sm text-muted-foreground mt-2">Describe what you want and I'll create it.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : msg.role === 'system'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-foreground'
              )}
            >
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm dark:prose-invert max-w-none">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-background">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
