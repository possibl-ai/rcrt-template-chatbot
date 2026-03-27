import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus } from 'lucide-react';
import { getClient } from '../lib/api-client';
import { useStore } from '../lib/store';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setSessionId, clearMessages } = useStore();

  useEffect(() => {
    getClient()
      .getSessions()
      .then((data: any) => {
        setSessions(Array.isArray(data) ? data : data?.sessions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startNew = () => {
    setSessionId(null);
    clearMessages();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
        <button onClick={startNew} className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2 pb-20 md:pb-4">
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No sessions yet. Start a conversation!</p>
        )}
        {sessions.map((s: any) => (
          <button
            key={s.session_id || s.id}
            onClick={() => {
              setSessionId(s.session_id || s.id);
              clearMessages();
              navigate(`/session/${s.session_id || s.id}`);
            }}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.title || s.session_id || 'Untitled'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.last_active ? new Date(s.last_active).toLocaleDateString() : ''}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
