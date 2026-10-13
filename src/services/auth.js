/**
 * Hardened Authentication Service
 * 
 * Interacts with serverless auth endpoints (/api/auth/login, /api/auth/logout, /api/auth/session).
 * Session authorization is handled server-side via HttpOnly JWT cookies.
 * Non-sensitive user metadata ({ id, email }) is synced with localStorage for UI convenience.
 */

const getApiUrl = (endpoint) => {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return `${window.location.origin}${endpoint}`;
  }
  return endpoint;
};

/**
 * Log in admin using email and password via POST /api/auth/login.
 * Returns { success: true, user } on success, or { success: false, message } on error.
 */
export const login = async (email, password) => {
  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('admin_user', JSON.stringify(data.user));
      }
      return {
        success: true,
        user: data.user,
      };
    }

    return {
      success: false,
      message: data.message || 'Invalid credentials',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Network error during authentication',
    };
  }
};

/**
 * Log out admin via POST /api/auth/logout and clear localStorage.
 */
export const logout = async () => {
  try {
    await fetch(getApiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('admin_user');
    }
  }
};

/**
 * Check active session against server via GET /api/auth/session.
 * Returns user metadata { id, email } if authenticated, or null otherwise.
 */
export const checkSession = async () => {
  try {
    const res = await fetch(getApiUrl('/api/auth/session'), {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('admin_user');
      }
      return null;
    }

    const data = await res.json().catch(() => ({}));

    if (data.authenticated && data.user) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('admin_user', JSON.stringify(data.user));
      }
      return data.user;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('admin_user');
    }
    return null;
  } catch (error) {
    console.error('Session verification error:', error);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('admin_user');
    }
    return null;
  }
};

/**
 * Synchronously retrieve cached non-sensitive user metadata from localStorage.
 */
export const getStoredUser = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const user = window.localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};
