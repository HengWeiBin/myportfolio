/**
 * Netlify Function: Admin Authentication Logout Endpoint
 * POST /api/auth/logout
 * 
 * Clears the HttpOnly admin_jwt session cookie by setting Max-Age=0.
 */

const cookie = require('cookie');

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

  const isSecure = process.env.NODE_ENV === 'production' || 
                   (event.headers && (event.headers['x-forwarded-proto'] === 'https'));

  const clearedCookie = cookie.serialize('admin_jwt', '', {
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
      'Set-Cookie': clearedCookie
    },
    multiValueHeaders: {
      'Set-Cookie': [clearedCookie]
    },
    body: JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    })
  };
};
