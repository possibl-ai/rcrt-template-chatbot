import { create } from 'zustand';

interface AppState {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  messages: Array<{ role: string; content: string; id?: string; timestamp?: string }>;
  addMessage: (msg: { role: string; content: string; id?: string }) => void;
  clearMessages: () => void;
}

export const useStore = create<AppState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  messages: [],
  addMessage: (msg) =>
    set((state) => {
      if (msg.id && state.messages.some((m) => m.id === msg.id)) return state;
      return { messages: [...state.messages, { ...msg, timestamp: new Date().toISOString() }] };
    }),
  clearMessages: () => set({ messages: [] }),
}));
