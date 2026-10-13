/**
 * Netlify Function: Admin Authentication Login Endpoint
 * POST /api/auth/login
 * 
 * Authenticates administrative credentials using bcrypt, generates a signed JWT,
 * and sets an HttpOnly cookie (admin_jwt) while returning sanitized user information.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { neon } = require('@netlify/neon');

let customSql = null;

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    } : {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    })
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'Invalid JSON body' })
    };
  }

  const { email, password } = body;
  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'Email and password are required' })
    };
  }

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || process.env.REACT_APP_DATABASE_URL;
  if (!customSql && !connectionString) {
    console.error('Database connection string is missing in environment');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Database configuration missing' })
    };
  }

  try {
    const sql = customSql || neon(connectionString);
    const rows = await sql`
      SELECT id, email, password FROM admins 
      WHERE email = ${email} 
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid credentials' })
      };
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid credentials' })
      };
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      jwtSecret,
      { expiresIn: '1d' }
    );

    const isSecure = process.env.NODE_ENV === 'production' || 
                     (event.headers && (event.headers['x-forwarded-proto'] === 'https'));

    const serializedCookie = cookie.serialize('admin_jwt', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 24 hours
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Set-Cookie': serializedCookie
      },
      multiValueHeaders: {
        'Set-Cookie': [serializedCookie]
      },
      body: JSON.stringify({
        success: true,
        user: {
          id: admin.id,
          email: admin.email
        }
      })
    };
  } catch (err) {
    console.error('Error during authentication login:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error during authentication' })
    };
  }
};

// Export test hook for unit test isolation
exports.__setSql = (mockSql) => {
  customSql = mockSql;
};
