/**
 * Netlify Function: Protected Admin CRUD Endpoint
 * POST /api/admin/crud
 * 
 * Secure endpoint restricted to authenticated administrators for managing
 * projects, certificates, experience, and profile with support for tiered content,
 * sorting order, and NDA attributes.
 */

const { neon } = require('@netlify/neon');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

let customSql = null;

const verifyAdmin = (event) => {
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
      return false;
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
      return false;
    }
  }

  return false;
};

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    } : {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!verifyAdmin(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Admin authentication required' })
    };
  }

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || process.env.REACT_APP_DATABASE_URL;
  if (!customSql && !connectionString) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database configuration missing' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON request body' })
    };
  }

  const { action, data = {}, id: rawId } = body;
  const id = rawId || data.id;

  try {
    const sql = customSql || neon(connectionString);
    let result = null;

    switch (action) {
      // PROJECTS
      case 'addProject':
      case 'createProject': {
        const { title, description, link, date_start, date_end, image_url, tags, tier, sort_order, visual_type, is_confidential, repo_visibility, metrics } = data;
        const serializedMetrics = typeof metrics === 'object' && metrics !== null ? JSON.stringify(metrics) : (metrics || '{}');
        const normalizedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((s) => s.trim()).filter(Boolean) : []);
        result = await sql`
          INSERT INTO projects (title, description, link, date_start, date_end, image_url, tags, tier, sort_order, visual_type, is_confidential, repo_visibility, metrics)
          VALUES (
            ${title}, 
            ${description || ''}, 
            ${link || ''}, 
            ${date_start || ''}, 
            ${date_end || ''}, 
            ${image_url || null}, 
            ${normalizedTags}, 
            ${tier || 'standard'}, 
            ${sort_order !== undefined ? Number(sort_order) : 0}, 
            ${visual_type || 'image'}, 
            ${Boolean(is_confidential)}, 
            ${repo_visibility || 'public'}, 
            ${serializedMetrics}
          )
          RETURNING *
        `;
        break;
      }
      case 'updateProject': {
        if (!id) throw new Error('Project id is required for update');
        const { title, description, link, date_start, date_end, image_url, tags, tier, sort_order, visual_type, is_confidential, repo_visibility, metrics } = data;
        const serializedMetrics = typeof metrics === 'object' && metrics !== null ? JSON.stringify(metrics) : (metrics || '{}');
        const normalizedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((s) => s.trim()).filter(Boolean) : []);
        result = await sql`
          UPDATE projects 
          SET title = ${title}, 
              description = ${description || ''}, 
              link = ${link || ''}, 
              date_start = ${date_start || ''}, 
              date_end = ${date_end || ''}, 
              image_url = ${image_url || null}, 
              tags = ${normalizedTags}, 
              tier = ${tier || 'standard'}, 
              sort_order = ${sort_order !== undefined ? Number(sort_order) : 0}, 
              visual_type = ${visual_type || 'image'}, 
              is_confidential = ${Boolean(is_confidential)}, 
              repo_visibility = ${repo_visibility || 'public'}, 
              metrics = ${serializedMetrics}
          WHERE id = ${id}
          RETURNING *
        `;
        break;
      }
      case 'deleteProject': {
        if (!id) throw new Error('Project id is required for deletion');
        result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;
        break;
      }

      // CERTIFICATES
      case 'addCertificate':
      case 'createCertificate': {
        const { title, issuer, date, image_url, credential_id, category, tier, sort_order } = data;
        result = await sql`
          INSERT INTO certificates (title, issuer, date, image_url, credential_id, category, tier, sort_order)
          VALUES (
            ${title}, 
            ${issuer || ''}, 
            ${date || ''}, 
            ${image_url || null}, 
            ${credential_id || ''}, 
            ${category || 'Certificate'}, 
            ${tier || 'standard'}, 
            ${sort_order !== undefined ? Number(sort_order) : 0}
          )
          RETURNING *
        `;
        break;
      }
      case 'updateCertificate': {
        if (!id) throw new Error('Certificate id is required for update');
        const { title, issuer, date, image_url, credential_id, category, tier, sort_order } = data;
        result = await sql`
          UPDATE certificates 
          SET title = ${title}, 
              issuer = ${issuer || ''}, 
              date = ${date || ''}, 
              image_url = ${image_url || null}, 
              credential_id = ${credential_id || ''}, 
              category = ${category || 'Certificate'}, 
              tier = ${tier || 'standard'}, 
              sort_order = ${sort_order !== undefined ? Number(sort_order) : 0}
          WHERE id = ${id}
          RETURNING *
        `;
        break;
      }
      case 'deleteCertificate': {
        if (!id) throw new Error('Certificate id is required for deletion');
        result = await sql`DELETE FROM certificates WHERE id = ${id} RETURNING id`;
        break;
      }

      // EXPERIENCE
      case 'addExperience':
      case 'createExperience': {
        const { role, company, date_range, description, tech_stack, sort_order } = data;
        result = await sql`
          INSERT INTO experience (role, company, date_range, description, tech_stack, sort_order)
          VALUES (
            ${role}, 
            ${company || ''}, 
            ${date_range || ''}, 
            ${description || ''}, 
            ${tech_stack || []}, 
            ${sort_order !== undefined ? Number(sort_order) : 0}
          )
          RETURNING *
        `;
        break;
      }
      case 'updateExperience': {
        if (!id) throw new Error('Experience id is required for update');
        const { role, company, date_range, description, tech_stack, sort_order } = data;
        result = await sql`
          UPDATE experience 
          SET role = ${role}, 
              company = ${company || ''}, 
              date_range = ${date_range || ''}, 
              description = ${description || ''}, 
              tech_stack = ${tech_stack || []}, 
              sort_order = ${sort_order !== undefined ? Number(sort_order) : 0}
          WHERE id = ${id}
          RETURNING *
        `;
        break;
      }
      case 'deleteExperience': {
        if (!id) throw new Error('Experience id is required for deletion');
        result = await sql`DELETE FROM experience WHERE id = ${id} RETURNING id`;
        break;
      }

      // SKILLS
      case 'addSkill':
      case 'createSkill': {
        const { category, name, icon } = data;
        result = await sql`
          INSERT INTO skills (category, name, icon)
          VALUES (${category}, ${name}, ${icon || null})
          RETURNING *
        `;
        break;
      }
      case 'updateSkill': {
        if (!id) throw new Error('Skill id is required for update');
        const { category, name, icon } = data;
        result = await sql`
          UPDATE skills 
          SET category = ${category}, 
              name = ${name},
              icon = ${icon || null}
          WHERE id = ${id}
          RETURNING *
        `;
        break;
      }
      case 'deleteSkill': {
        if (!id) throw new Error('Skill id is required for deletion');
        result = await sql`DELETE FROM skills WHERE id = ${id} RETURNING id`;
        break;
      }

      // PROFILE
      case 'updateProfile': {
        const profileId = id || data.id;
        if (profileId) {
          result = await sql`
            UPDATE profile 
            SET name = ${data.name}, 
                title = ${data.title}, 
                email = ${data.email}, 
                phone = ${data.phone}, 
                bio = ${data.bio},
                github = ${data.github},
                linkedin = ${data.linkedin},
                instagram = ${data.instagram},
                facebook = ${data.facebook},
                resume_link = ${data.resume_link || null}
            WHERE id = ${profileId}
            RETURNING *
          `;
        } else {
          result = await sql`
            INSERT INTO profile (name, title, email, phone, bio, github, linkedin, instagram, facebook, resume_link)
            VALUES (${data.name}, ${data.title}, ${data.email}, ${data.phone}, ${data.bio}, ${data.github}, ${data.linkedin}, ${data.instagram}, ${data.facebook}, ${data.resume_link || null})
            RETURNING *
          `;
        }
        break;
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Unsupported action: ${action}` })
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, result })
    };
  } catch (err) {
    console.error('Admin CRUD error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

exports.__setSql = (mockSql) => {
  customSql = mockSql;
};
