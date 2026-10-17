import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminAgentHandler, { __setSql, __resetState } from '../../netlify/functions/admin-agent';
import {
  getLlmConfig,
  updateLlmConfig,
  testLlmLatency,
  getConversations,
  exportConversationAsDemo
} from './api';

describe('Admin Agent Endpoints (Issue #11)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NETLIFY_DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.REACT_APP_DATABASE_URL;
    __resetState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const authHeader = {
    headers: {
      cookie: 'admin_jwt=mock-valid-admin-jwt'
    }
  };

  it('rejects unauthenticated requests with HTTP 401', async () => {
    const res = await adminAgentHandler.handler({
      httpMethod: 'GET',
      path: '/api/admin/llm/config',
      headers: {}
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('GET /api/admin/llm/config returns active LLM config with masked API key and defaults', async () => {
    const res = await adminAgentHandler.handler({
      httpMethod: 'GET',
      path: '/api/admin/llm/config',
      ...authHeader
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.config).toBeDefined();
    expect(body.config.provider).toBe('gemini');
    expect(body.config.model_name).toBe('gemini-1.5-flash');
    expect(body.config.system_prompt).toContain('portfolio assistant');
    expect(body.config.daily_rate_limit).toBe(5);
    // Should never expose plaintext key
    if (body.config.api_key_masked) {
      expect(body.config.api_key_masked.startsWith('••••')).toBe(true);
    }
  });

  it('POST /api/admin/llm/config saves and encrypts new API key', async () => {
    const res = await adminAgentHandler.handler({
      httpMethod: 'POST',
      path: '/api/admin/llm/config',
      ...authHeader,
      body: JSON.stringify({
        provider: 'openai',
        model: 'gpt-4o-mini',
        api_key: 'sk-test-secret-key-1234',
        base_url: 'https://api.openai.com/v1',
        system_prompt: 'Custom tuned agent instructions for high-throughput testing.',
        daily_rate_limit: 10
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.config.provider).toBe('openai');
    expect(body.config.model).toBe('gpt-4o-mini');
    expect(body.config.daily_rate_limit).toBe(10);
    expect(body.config.system_prompt).toBe('Custom tuned agent instructions for high-throughput testing.');
    expect(body.config.api_key_masked).toBe('••••1234');

    // Verify GET retrieves the updated masked config
    const getRes = await adminAgentHandler.handler({
      httpMethod: 'GET',
      path: '/api/admin/llm/config',
      ...authHeader
    });
    const getBody = JSON.parse(getRes.body);
    expect(getBody.config.api_key_masked).toBe('••••1234');
    expect(getBody.config.daily_rate_limit).toBe(10);
  });

  it('POST /api/admin/llm/test returns measured latency and reply', async () => {
    const res = await adminAgentHandler.handler({
      httpMethod: 'POST',
      path: '/api/admin/llm/test',
      ...authHeader,
      body: JSON.stringify({
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        api_key: 'mock-test-key'
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(typeof body.latency_ms).toBe('number');
    expect(body.latency_ms).toBeGreaterThan(0);
    expect(body.reply).toBeDefined();
  });

  it('GET /api/admin/conversations returns telemetry rows', async () => {
    const res = await adminAgentHandler.handler({
      httpMethod: 'GET',
      path: '/api/admin/conversations',
      ...authHeader
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.conversations)).toBe(true);
    expect(body.conversations.length).toBeGreaterThan(0);
    expect(body.conversations[0]).toHaveProperty('prompt');
    expect(body.conversations[0]).toHaveProperty('latency_ms');
  });

  it('exportConversationAsDemo formats conversation into fallback trace and stores to localStorage', () => {
    const sampleConv = {
      id: 'conv-991',
      session_id: 'sess-100',
      prompt: 'Tell me about CenterFusion sensor fusion',
      response: 'CenterFusion integrates radar point clouds with RGB features.',
      tool_trace: [{ tool: 'list_projects', params: {}, result: [] }]
    };

    const trace = exportConversationAsDemo(sampleConv);
    expect(trace).toBeDefined();
    expect(trace.id).toContain('exported_conv-991');
    expect(trace.lang).toBe('en');
    expect(trace.keywords).toContain('centerfusion');
    expect(trace.toolCalls).toHaveLength(1);
    expect(trace.response).toBe(sampleConv.response);

    const storedRaw = window.localStorage.getItem('agent_fallback_traces');
    expect(storedRaw).toBeTruthy();
    const stored = JSON.parse(storedRaw);
    expect(stored[0].id).toBe(trace.id);
  });
});
