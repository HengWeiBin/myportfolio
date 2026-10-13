const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const getPool = (customConnectionString) => {
  const connectionString = customConnectionString || process.env.DATABASE_URL || process.env.REACT_APP_DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
};

const MIGRATIONS = [
  {
    name: '001_create_core_tables',
    up: async (client) => {
      // Admins Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        );
      `);

      // Profile Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS profile (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          title TEXT,
          email TEXT,
          phone TEXT,
          bio TEXT,
          github TEXT,
          linkedin TEXT,
          instagram TEXT,
          facebook TEXT,
          resume_link TEXT
        );
      `);

      // Projects Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          link TEXT,
          date_start TEXT,
          date_end TEXT,
          image_url TEXT,
          image_base64 TEXT,
          tags TEXT[],
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Certificates Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS certificates (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          issuer TEXT,
          date TEXT,
          image_url TEXT,
          image_base64 TEXT,
          credential_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Skills Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS skills (
          id SERIAL PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          icon TEXT
        );
      `);

      // Experience Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS experience (
          id SERIAL PRIMARY KEY,
          role TEXT NOT NULL,
          company TEXT NOT NULL,
          date_range TEXT NOT NULL,
          description TEXT,
          tech_stack TEXT[]
        );
      `);
    }
  },
  {
    name: '002_add_resume_and_image_urls',
    up: async (client) => {
      await client.query(`
        ALTER TABLE profile 
        ADD COLUMN IF NOT EXISTS resume_link TEXT;
      `);
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);
      await client.query(`
        ALTER TABLE certificates 
        ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);
    }
  },
  {
    name: '003_seed_default_data_if_empty',
    up: async (client) => {
      // Check admin
      const adminEmail = 'hengweibin1898@gmail.com';
      const adminPass = 'admin';
      const adminCheck = await client.query('SELECT id FROM admins WHERE email = $1', [adminEmail]);
      if (adminCheck.rows.length === 0) {
        await client.query('INSERT INTO admins (email, password) VALUES ($1, $2)', [adminEmail, adminPass]);
      }

      // Check skills
      const skillsCheck = await client.query('SELECT id FROM skills LIMIT 1');
      if (skillsCheck.rows.length === 0) {
        const skills = [
          { category: 'Languages', name: 'Go' },
          { category: 'Languages', name: 'Python' },
          { category: 'Languages', name: 'Rust' },
          { category: 'Languages', name: 'SQL' },
          { category: 'Backend', name: 'Docker' },
          { category: 'Backend', name: 'Kubernetes' },
          { category: 'Backend', name: 'gRPC' },
          { category: 'Backend', name: 'PostgreSQL' },
          { category: 'Backend', name: 'Redis' },
          { category: 'Tools & Infra', name: 'AWS' },
          { category: 'Tools & Infra', name: 'Terraform' },
          { category: 'Tools & Infra', name: 'Git' },
          { category: 'Tools & Infra', name: 'Linux' },
        ];
        for (const skill of skills) {
          await client.query('INSERT INTO skills (category, name) VALUES ($1, $2)', [skill.category, skill.name]);
        }
      }
    }
  },
  {
    name: '004_harden_admin_passwords_bcrypt',
    up: async (client) => {
      await client.query(`
        ALTER TABLE admins 
        ALTER COLUMN password TYPE VARCHAR(255);
      `);

      const adminsRes = await client.query('SELECT id, password FROM admins');
      for (const admin of adminsRes.rows) {
        if (!admin.password || (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$'))) {
          const hash = await bcrypt.hash(admin.password || 'admin', 10);
          await client.query('UPDATE admins SET password = $1 WHERE id = $2', [hash, admin.id]);
        }
      }
    }
  },
  {
    name: '005_tiered_content_and_nda_metadata',
    up: async (client) => {
      const sqlPath = path.join(__dirname, '../migrations/005_tiered_content_and_nda_metadata.sql');
      let sqlContent;
      if (fs.existsSync(sqlPath)) {
        sqlContent = fs.readFileSync(sqlPath, 'utf8');
      } else {
        sqlContent = `
          ALTER TABLE projects 
          ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard',
          ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS visual_type TEXT DEFAULT 'image',
          ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS repo_visibility TEXT DEFAULT 'public',
          ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

          UPDATE projects SET tier = 'standard' WHERE tier IS NULL;
          UPDATE projects SET sort_order = 0 WHERE sort_order IS NULL;
          UPDATE projects SET visual_type = 'image' WHERE visual_type IS NULL;
          UPDATE projects SET is_confidential = FALSE WHERE is_confidential IS NULL;
          UPDATE projects SET repo_visibility = 'public' WHERE repo_visibility IS NULL;
          UPDATE projects SET metrics = '{}'::jsonb WHERE metrics IS NULL;

          ALTER TABLE certificates 
          ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Certificate',
          ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard',
          ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

          UPDATE certificates SET category = 'Certificate' WHERE category IS NULL;
          UPDATE certificates SET tier = 'standard' WHERE tier IS NULL;
          UPDATE certificates SET sort_order = 0 WHERE sort_order IS NULL;

          ALTER TABLE experience 
          ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

          UPDATE experience SET sort_order = 0 WHERE sort_order IS NULL;
        `;
      }
      await client.query(sqlContent);
    }
  }
];

function loadSqlMigrations(dirPath = path.join(__dirname, '../migrations')) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.sql')).sort();
  return files.map(file => {
    const name = file.replace(/\.sql$/, '');
    return {
      name,
      file,
      up: async (client) => {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
        await client.query(content);
      }
    };
  });
}


async function migrate(customPool, options = {}) {
  const pool = customPool || getPool();
  if (!pool) {
    console.warn('[migrate] No database connection string provided. Skipping migration.');
    return { applied: [], skipped: [] };
  }

  const client = await pool.connect();
  const applied = [];
  const skipped = [];

  try {
    console.log('[migrate] Connected to database. Ensuring schema_migrations table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const existingMigrations = await client.query('SELECT name FROM schema_migrations');
    const appliedNames = new Set(existingMigrations.rows.map(r => r.name));

    // Combine base MIGRATIONS and any additional SQL migrations in migrationsDir
    const migrationsDir = options.migrationsDir || path.join(__dirname, '../migrations');
    const sqlMigrations = loadSqlMigrations(migrationsDir);
    const existingNames = new Set(MIGRATIONS.map(m => m.name));
    const extraSqlMigrations = sqlMigrations.filter(m => !existingNames.has(m.name));
    const migrationsToRun = options.migrations || [...MIGRATIONS, ...extraSqlMigrations];

    for (const migration of migrationsToRun) {
      if (appliedNames.has(migration.name)) {
        console.log(`[migrate] Migration "${migration.name}" already applied. Skipping.`);
        skipped.push(migration.name);
        continue;
      }

      console.log(`[migrate] Applying migration "${migration.name}"...`);
      await client.query('BEGIN');
      try {
        await migration.up(client);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]);
        await client.query('COMMIT');
        console.log(`[migrate] Successfully applied "${migration.name}".`);
        applied.push(migration.name);
      } catch (migrationError) {
        await client.query('ROLLBACK');
        throw migrationError;
      }
    }

    console.log('[migrate] All migrations applied successfully.');
    return { applied, skipped };
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    if (!customPool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('[migrate] Error executing migrations:', err.message);
    process.exit(1);
  });
}

module.exports = {
  migrate,
  MIGRATIONS,
  loadSqlMigrations,
};

