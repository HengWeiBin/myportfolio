/**
 * Netlify Function: Public Portfolio Aggregation Endpoint
 * 
 * Aggregates and returns public portfolio data (profile, skills, projects, experience, certificates)
 * in a single round-trip without leaking database credentials or private columns.
 */

const { neon } = require('@netlify/neon');

let customSql = null;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
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
      sql`SELECT id, title, description, link, date_start, date_end, image_url, tags FROM projects ORDER BY date_end DESC`,
      sql`SELECT id, role, company, date_range, description, tech_stack FROM experience ORDER BY id DESC`,
      sql`SELECT id, title, issuer, date, image_url, credential_id FROM certificates ORDER BY date DESC`
    ]);

    const payload = {
      profile: profileRows && profileRows.length > 0 ? profileRows[0] : null,
      skills: skillsRows || [],
      projects: projectsRows || [],
      experience: experienceRows || [],
      certificates: certificatesRows || []
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=60, s-maxage=300'
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
