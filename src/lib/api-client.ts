import { createClient, RcrtClient } from './rcrt-api';
import { getAuthToken } from './auth';

let client: RcrtClient | null = null;

export function getClient(): RcrtClient {
  if (!client) {
    client = createClient({
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
      adapter: {
        getToken: () => getAuthToken(),
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

export type { RcrtClient };
