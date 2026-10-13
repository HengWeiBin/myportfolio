import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

import loginHandler from '../../netlify/functions/auth-login';
import logoutHandler from '../../netlify/functions/auth-logout';
import sessionHandler from '../../netlify/functions/auth-session';
import { login, logout, checkSession, getStoredUser } from './auth';

const TEST_SECRET = 'test-jwt-secret-key';

describe('Serverless Auth Function: POST /api/auth/login', () => {
  const originalEnv = process.env;
  let hashedPassword;

  beforeEach(async () => {
    hashedPassword = await bcrypt.hash('correct-password-123', 10);
    process.env = {
      ...originalEnv,
      JWT_SECRET: TEST_SECRET,
      DATABASE_URL: 'postgresql://test:test@ep-test.neon.tech/neondb'
    };
  });

  afterEach(() => {
    loginHandler.__setSql(null);
    process.env = originalEnv;
  });

  it('handles OPTIONS preflight request with CORS headers', async () => {
    const res = await loginHandler.handler({
      httpMethod: 'OPTIONS',
      headers: { origin: 'http://localhost:3000' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const res = await loginHandler.handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(405);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
  });

  it('rejects requests with missing email or password with 400 Bad Request', async () => {
    const res = await loginHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'admin@example.com' })
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Email and password are required');
  });

  it('rejects non-existent administrative users with 401 Unauthorized', async () => {
    loginHandler.__setSql(vi.fn().mockResolvedValue([]));

    const res = await loginHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'any-password' })
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid credentials');
    expect(res.headers['Set-Cookie']).toBeUndefined();
  });

  it('rejects incorrect passwords via bcrypt matching with 401 Unauthorized', async () => {
    loginHandler.__setSql(vi.fn().mockResolvedValue([
      { id: 1, email: 'admin@example.com', password: hashedPassword }
    ]));

    const res = await loginHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'wrong-password' })
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid credentials');
    expect(res.headers['Set-Cookie']).toBeUndefined();
  });

  it('authenticates valid credentials, signs JWT, sets HttpOnly cookie, and sanitizes user data', async () => {
    loginHandler.__setSql(vi.fn().mockResolvedValue([
      { id: 7, email: 'hengweibin1898@gmail.com', password: hashedPassword }
    ]));

    const res = await loginHandler.handler({
      httpMethod: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: JSON.stringify({ email: 'hengweibin1898@gmail.com', password: 'correct-password-123' })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.user).toEqual({ id: 7, email: 'hengweibin1898@gmail.com' });

    // Ensure raw password / hash is NEVER returned
    expect(res.body).not.toContain(hashedPassword);
    expect(res.body).not.toContain('correct-password-123');

    // Verify HttpOnly cookie attributes
    const setCookieHeader = res.headers['Set-Cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('Path=/');
    expect(setCookieHeader).toContain('SameSite=Lax');

    // Verify JWT payload signature
    const parsedCookie = cookie.parse(setCookieHeader);
    const token = parsedCookie.admin_jwt;
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.id).toBe(7);
    expect(decoded.email).toBe('hengweibin1898@gmail.com');
  });
});

describe('Serverless Auth Function: POST /api/auth/logout', () => {
  it('clears admin_jwt cookie by setting Max-Age=0', async () => {
    const res = await logoutHandler.handler({
      httpMethod: 'POST',
      headers: { origin: 'http://localhost:3000' }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);

    const setCookieHeader = res.headers['Set-Cookie'];
    expect(setCookieHeader).toContain('admin_jwt=');
    expect(setCookieHeader).toContain('Max-Age=0');
    expect(setCookieHeader).toContain('HttpOnly');
  });
});

describe('Serverless Auth Function: GET /api/auth/session', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: TEST_SECRET
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns authenticated: false when no cookie is present', async () => {
    const res = await sessionHandler.handler({
      httpMethod: 'GET',
      headers: {}
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.authenticated).toBe(false);
  });

  it('validates active JWT cookie and returns sanitized user session', async () => {
    const token = jwt.sign({ id: 10, email: 'admin@myportfolio.com' }, TEST_SECRET, { expiresIn: '1h' });

    const res = await sessionHandler.handler({
      httpMethod: 'GET',
      headers: {
        cookie: `admin_jwt=${token}`
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.authenticated).toBe(true);
    expect(body.user).toEqual({ id: 10, email: 'admin@myportfolio.com' });
  });

  it('evicts expired sessions, returns authenticated: false, and clears cookie', async () => {
    const expiredToken = jwt.sign(
      { id: 10, email: 'admin@myportfolio.com' },
      TEST_SECRET,
      { expiresIn: '-10s' } // Expired token
    );

    const res = await sessionHandler.handler({
      httpMethod: 'GET',
      headers: {
        cookie: `admin_jwt=${expiredToken}`
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.authenticated).toBe(false);
    expect(body.error).toBe('Session expired');

    // Must evict expired cookie
    const setCookieHeader = res.headers['Set-Cookie'];
    expect(setCookieHeader).toContain('Max-Age=0');
    expect(setCookieHeader).toContain('HttpOnly');
  });

  it('rejects tampered or invalid JWT signatures and clears cookie', async () => {
    const forgedToken = jwt.sign({ id: 99, email: 'hacker@example.com' }, 'unauthorized-secret-key');

    const res = await sessionHandler.handler({
      httpMethod: 'GET',
      headers: {
        cookie: `admin_jwt=${forgedToken}`
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.authenticated).toBe(false);
    expect(body.error).toBe('Invalid session signature');

    const setCookieHeader = res.headers['Set-Cookie'];
    expect(setCookieHeader).toContain('Max-Age=0');
  });
});

describe('Client Auth Service (src/services/auth.js)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.localStorage.clear();
  });

  it('login sends credentials, stores user in localStorage on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        user: { id: 1, email: 'admin@example.com' }
      })
    });

    const res = await login('admin@example.com', 'password123');
    expect(res.success).toBe(true);
    expect(res.user.email).toBe('admin@example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
      })
    );

    const stored = getStoredUser();
    expect(stored).toEqual({ id: 1, email: 'admin@example.com' });
  });

  it('login returns failure and does not set localStorage on invalid credentials', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Invalid credentials' })
    });

    const res = await login('admin@example.com', 'wrong');
    expect(res.success).toBe(false);
    expect(res.message).toBe('Invalid credentials');
    expect(getStoredUser()).toBeNull();
  });

  it('logout calls /api/auth/logout with credentials: include and removes localStorage item', async () => {
    window.localStorage.setItem('admin_user', JSON.stringify({ id: 1, email: 'admin@example.com' }));

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });

    await logout();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    );
    expect(getStoredUser()).toBeNull();
  });

  it('checkSession verifies session against server and syncs localStorage', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        user: { id: 5, email: 'admin@test.com' }
      })
    });

    const user = await checkSession();
    expect(user).toEqual({ id: 5, email: 'admin@test.com' });
    expect(getStoredUser()).toEqual({ id: 5, email: 'admin@test.com' });
  });

  it('checkSession clears localStorage when session is not authenticated', async () => {
    window.localStorage.setItem('admin_user', JSON.stringify({ id: 5, email: 'stale@test.com' }));

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ authenticated: false })
    });

    const user = await checkSession();
    expect(user).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
