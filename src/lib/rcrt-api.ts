/**
 * RCRT API Client — self-contained, no external dependencies.
 *
 * This is the canonical API client for RCRT frontend apps.
 * It communicates with the RCRT API Gateway via REST + SSE.
 *
 * IMPORTANT: There is NO /v1/tools/run endpoint.
 * Tools execute via agent tool_calls — send a chat message to an agent
 * and the agent decides which tools to call.
 */

export interface RcrtClientConfig {
  apiUrl: string;
  adapter: {
    getToken: () => Promise<string | null>;
    getTenantId: () => string | null;
    onUnauthorized: () => Promise<'abort' | 'retry'>;
  };
}

export interface Breadcrumb {
  id: string;
  name?: string;
  title?: string;
  tags?: string[];
  content?: Record<string, unknown>;
  created_by?: { type: string; id: string };
  created_at?: string;
  version?: number;
}

export interface ChatResponse {
  id: string;
  session_id: string;
}

export interface MeResponse {
  user: { id: string; email: string; name: string; picture?: string };
  is_platform_admin: boolean;
  organizations: Array<{ id: string; name: string; role: string }>;
  tenants: Array<{ id: string; name: string; role: string }>;
  active_tenant?: { id: string; name: string; role: string };
  permissions: string[];
  grants: unknown[];
}

export class RcrtClient {
  private apiUrl: string;
  private adapter: RcrtClientConfig['adapter'];

  constructor(config: RcrtClientConfig) {
    this.apiUrl = config.apiUrl;
    this.adapter = config.adapter;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.adapter.getToken();
    const tenantId = this.adapter.getTenantId();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (tenantId) h['X-Tenant-ID'] = tenantId;
    return h;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const h = await this.headers();
    const res = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: { ...h, ...(options?.headers as Record<string, string> || {}) },
    });
    if (res.status === 401) {
      const action = await this.adapter.onUnauthorized();
      if (action === 'abort') throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`RCRT API ${res.status}: ${text.slice(0, 200)}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // ── Breadcrumbs ──────────────────────────────────────────────

  async createBreadcrumb(data: {
    name?: string;
    title?: string;
    tags?: string[];
    content?: Record<string, unknown>;
    upsert?: boolean;
  }): Promise<Breadcrumb> {
    const result = await this.request<{ breadcrumb: Breadcrumb }>('/v1/breadcrumbs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.breadcrumb ?? result as unknown as Breadcrumb;
  }

  async queryBreadcrumbs(tags: string[], limit = 100): Promise<Breadcrumb[]> {
    const params = new URLSearchParams();
    tags.forEach((t) => params.append('tags', t));
    params.set('limit', String(limit));
    return this.request<Breadcrumb[]>(`/v1/breadcrumbs?${params}`);
  }

  async getBreadcrumb(id: string): Promise<Breadcrumb> {
    return this.request<Breadcrumb>(`/v1/breadcrumbs/${id}`);
  }

  async updateBreadcrumb(
    id: string,
    data: { title?: string; content?: Record<string, unknown>; tags?: string[]; version: number },
  ): Promise<Breadcrumb> {
    return this.request<Breadcrumb>(`/v1/breadcrumbs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBreadcrumb(id: string): Promise<void> {
    return this.request<void>(`/v1/breadcrumbs/${id}`, { method: 'DELETE' });
  }

  // ── Chat ─────────────────────────────────────────────────────
  // Send a message to an agent. Response arrives via SSE, not here.
  // This is how you trigger tool execution — the agent calls tools.

  async sendChat(message: string, sessionId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  }

  // ── Files ────────────────────────────────────────────────────

  async uploadFile(file: File | Blob, scope: 'tenant' | 'org' | 'user' = 'tenant'): Promise<Breadcrumb> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', scope);
    const token = await this.adapter.getToken();
    const tenantId = this.adapter.getTenantId();
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (tenantId) h['X-Tenant-ID'] = tenantId;
    const res = await fetch(`${this.apiUrl}/v1/files`, { method: 'POST', headers: h, body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const result = await res.json();
    return result.breadcrumb ?? result;
  }

  async getFileDownloadUrl(fileId: string): Promise<string> {
    const result = await this.request<{ download_url: string }>(`/v1/files/${fileId}/content?expiry=1h`);
    return result.download_url;
  }

  async getFileText(fileId: string): Promise<string> {
    const result = await this.request<{ text: string }>(`/v1/files/${fileId}/text`);
    return result.text;
  }

  // ── Sessions ─────────────────────────────────────────────────

  async getSessions(limit = 30): Promise<Breadcrumb[]> {
    return this.queryBreadcrumbs(['interpret:session'], limit);
  }

  async getSessionMessages(sessionId: string, limit = 100): Promise<Breadcrumb[]> {
    return this.queryBreadcrumbs(['llm-section:conversation', `session:${sessionId}`], limit);
  }

  // ── Auth ─────────────────────────────────────────────────────

  async authMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/v1/auth/me');
  }

  async selectTenant(tenantId: string): Promise<void> {
    await this.request(`/v1/auth/tenants/${tenantId}/select`, { method: 'POST' });
  }

  // ── SSE Events ───────────────────────────────────────────────
  // Connect to the event stream for real-time updates.

  connectEvents(onEvent: (event: { type: string; data: unknown }) => void): () => void {
    let closed = false;

    const connect = async () => {
      if (closed) return;
      const token = await this.adapter.getToken();
      const tenantId = this.adapter.getTenantId();
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      if (tenantId) params.set('tenant_id', tenantId);

      const es = new EventSource(`${this.apiUrl}/v1/events?${params}`);
      es.addEventListener('breadcrumb', (e) => {
        try { onEvent({ type: 'breadcrumb', data: JSON.parse((e as MessageEvent).data) }); } catch {}
      });
      es.addEventListener('heartbeat', () => {
        onEvent({ type: 'heartbeat', data: null });
      });
      es.onerror = () => {
        es.close();
        if (!closed) setTimeout(connect, 3000);
      };
    };

    connect();
    return () => { closed = true; };
  }

  // ── Services ─────────────────────────────────────────────────

  async resolveService(name: string): Promise<{ service: string; credentials: Record<string, unknown> }> {
    return this.request(`/v1/services/${name}/resolve`);
  }
}

export function createClient(config: RcrtClientConfig): RcrtClient {
  return new RcrtClient(config);
}
