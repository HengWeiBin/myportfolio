/**
 * Netlify Function: Public Portfolio Aggregation Endpoint
 * 
 * Aggregates and returns portfolio data (profile, skills, projects, experience, certificates)
 * with support for tier filtering, structured tiered grouping, sort order, and NDA metadata redaction.
 */

const { neon } = require('@netlify/neon');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

let customSql = null;

const isAdminRequest = (event) => {
  if (!event || !event.headers) return false;

  // 1. Check API Key header
  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
  const expectedKey = process.env.ADMIN_API_KEY || process.env.REACT_APP_ADMIN_API_KEY;
  if (adminKey && expectedKey && adminKey === expectedKey) {
    return true;
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

  // 2. Check Authorization Bearer token
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      jwt.verify(token, jwtSecret);
      return true;
    } catch {
      // invalid token
    }
  }

  // 3. Check admin_jwt cookie
  const cookieHeader = event.headers.cookie || event.headers.Cookie;
  if (cookieHeader) {
    try {
      const parsed = cookie.parse(cookieHeader);
      if (parsed.admin_jwt) {
        jwt.verify(parsed.admin_jwt, jwtSecret);
        return true;
      }
    } catch {
      // invalid cookie
    }
  }

  return false;
};

const isMissingColumnError = (err) => {
  if (!err) return false;
  if (err.code === '42703') return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('column');
};

const fetchProjects = async (sql) => {
  try {
    return await sql`SELECT id, title, description, link, date_start, date_end, image_url, tags, tier, sort_order, visual_type, is_confidential, repo_visibility, metrics FROM projects ORDER BY sort_order ASC, date_end DESC`;
  } catch (err) {
    if (isMissingColumnError(err)) {
      return await sql`SELECT id, title, description, link, date_start, date_end, image_url, tags FROM projects ORDER BY date_end DESC`;
    }
    throw err;
  }
};

const fetchExperience = async (sql) => {
  try {
    return await sql`SELECT id, role, company, date_range, description, tech_stack, sort_order FROM experience ORDER BY sort_order ASC, id DESC`;
  } catch (err) {
    if (isMissingColumnError(err)) {
      return await sql`SELECT id, role, company, date_range, description, tech_stack FROM experience ORDER BY id DESC`;
    }
    throw err;
  }
};

const fetchCertificates = async (sql) => {
  try {
    return await sql`SELECT id, title, issuer, date, image_url, credential_id, category, tier, sort_order FROM certificates ORDER BY sort_order ASC, date DESC`;
  } catch (err) {
    if (isMissingColumnError(err)) {
      return await sql`SELECT id, title, issuer, date, image_url, credential_id FROM certificates ORDER BY date DESC`;
    }
    throw err;
  }
};

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    } : {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || process.env.REACT_APP_DATABASE_URL;

  if (!customSql && !connectionString) {
    console.error('Database connection string is missing in environment');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database configuration missing' })
    };
  }

  try {
    const sql = customSql || neon(connectionString);

    const [profileRows, skillsRows, projectsRows, experienceRows, certificatesRows] = await Promise.all([
      sql`SELECT id, name, title, email, phone, bio, github, linkedin, instagram, facebook, resume_link FROM profile LIMIT 1`,
      sql`SELECT id, category, name FROM skills ORDER BY id ASC`,
      fetchProjects(sql),
      fetchExperience(sql),
      fetchCertificates(sql)
    ]);

    const isAdmin = isAdminRequest(event);

    const rawProjects = projectsRows || [];
    const sanitizedProjects = rawProjects.map(p => {
      const isConfidential = Boolean(p.is_confidential);
      let link = p.link;
      let metrics = p.metrics !== undefined && p.metrics !== null ? p.metrics : {};
      if (typeof metrics === 'string') {
        try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
      }

      if (isConfidential && !isAdmin) {
        link = null;
        metrics = {};
      }

      return {
        ...p,
        tier: p.tier || 'standard',
        sort_order: p.sort_order !== undefined && p.sort_order !== null ? Number(p.sort_order) : 0,
        visual_type: p.visual_type || 'image',
        is_confidential: isConfidential,
        repo_visibility: p.repo_visibility || 'public',
        link,
        metrics
      };
    });

    const rawCertificates = certificatesRows || [];
    const sanitizedCertificates = rawCertificates.map(c => ({
      ...c,
      category: c.category || 'Certificate',
      tier: c.tier || 'standard',
      sort_order: c.sort_order !== undefined && c.sort_order !== null ? Number(c.sort_order) : 0
    }));

    const rawExperience = experienceRows || [];
    const sanitizedExperience = rawExperience.map(e => ({
      ...e,
      sort_order: e.sort_order !== undefined && e.sort_order !== null ? Number(e.sort_order) : 0
    }));

    const groupByTier = (items) => {
      return items.reduce((acc, item) => {
        const key = item.tier || 'standard';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    };

    const reqTier = event.queryStringParameters?.tier;
    let finalProjects = sanitizedProjects;
    let finalCertificates = sanitizedCertificates;

    if (reqTier) {
      const target = reqTier.toLowerCase();
      finalProjects = sanitizedProjects.filter(p => (p.tier || '').toLowerCase() === target);
      finalCertificates = sanitizedCertificates.filter(c => (c.tier || '').toLowerCase() === target);
    }

    const payload = {
      profile: profileRows && profileRows.length > 0 ? profileRows[0] : null,
      skills: skillsRows || [],
      projects: finalProjects,
      experience: sanitizedExperience,
      certificates: finalCertificates,
      tiered_projects: groupByTier(sanitizedProjects),
      tiered_certificates: groupByTier(sanitizedCertificates),
      tiered: {
        projects: groupByTier(sanitizedProjects),
        certificates: groupByTier(sanitizedCertificates)
      }
    };

    const isFreshQuery = Boolean(
      event.queryStringParameters?.fresh ||
      event.queryStringParameters?._t
    );
    const shouldBypassCache = isAdmin || isFreshQuery;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Vary': 'Cookie, Authorization, x-admin-key',
        'Cache-Control': shouldBypassCache ? 'no-cache, no-store, must-revalidate' : 'public, max-age=60, s-maxage=300'
      },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    console.error('Error fetching portfolio data:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch portfolio data' })
    };
  }
};

// Export test hook for unit test isolation
exports.__setSql = (mockSql) => {
  customSql = mockSql;
};
