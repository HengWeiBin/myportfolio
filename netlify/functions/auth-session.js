/**
 * Netlify Function: Admin Authentication Session Endpoint
 * GET /api/auth/session
 * 
 * Verifies the admin_jwt HttpOnly cookie signature and expiration,
 * returning session validity and user metadata.
 */

const jwt = require('jsonwebtoken');
const cookie = require('cookie');

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    } : {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    })
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ authenticated: false, error: 'Method not allowed' })
    };
  }

  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
  const parsedCookies = cookie.parse(cookieHeader);
  const token = parsedCookies.admin_jwt;

  if (!token) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ authenticated: false })
    };
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  const isSecure = process.env.NODE_ENV === 'production' || 
                   (event.headers && (event.headers['x-forwarded-proto'] === 'https'));

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        user: {
          id: decoded.id,
          email: decoded.email
        }
      })
    };
  } catch (err) {
    const clearCookie = cookie.serialize('admin_jwt', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Set-Cookie': clearCookie
      },
      multiValueHeaders: {
        'Set-Cookie': [clearCookie]
      },
      body: JSON.stringify({
        authenticated: false,
        error: err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid session signature'
      })
    };
  }
};
