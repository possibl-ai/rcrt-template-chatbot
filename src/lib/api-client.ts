import { createClient, RcrtClient } from '@rcrt/api';
import { getAuth } from 'firebase/auth';

let client: RcrtClient | null = null;

export function getClient(): RcrtClient {
  if (!client) {
    client = createClient({
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
      adapter: {
        getToken: async () => {
          try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) return user.getIdToken();
          } catch {}
          return localStorage.getItem('rcrt_token');
        },
        getTenantId: () => localStorage.getItem('rcrt_tenant_id'),
        onUnauthorized: async () => 'abort',
      },
    });
  }
  return client;
}

export function resetClient(): void {
  client = null;
}
