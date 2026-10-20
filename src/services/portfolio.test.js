import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { 
  fetchPortfolioData, 
  getProjects, 
  getTieredProjects, 
  getCertificates, 
  getSkills, 
  getExperience, 
  getProfile,
  addProject,
  updateProject,
  deleteProject,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  addSkill,
  updateSkill,
  deleteSkill,
  addExperience,
  updateExperience,
  deleteExperience,
  updateProfile
} from './api';
import portfolioHandler from '../../netlify/functions/portfolio';
import adminCrudHandler from '../../netlify/functions/admin-crud';

// Test mock fixtures
const mockProfile = {
  id: 1,
  name: 'Alex Chen',
  title: 'Machine Learning Engineer',
  email: 'alex@example.com',
  phone: '+123456789',
  bio: 'Building production ML pipelines.',
  github: 'https://github.com/alexchen',
  linkedin: 'https://linkedin.com/in/alexchen',
  instagram: 'https://instagram.com/alexchen',
  facebook: 'https://facebook.com/alexchen',
  resume_link: 'https://example.com/resume.pdf'
};

const mockSkills = [
  { id: 1, category: 'ML & AI', name: 'PyTorch' },
  { id: 2, category: 'ML & AI', name: 'TensorFlow' },
  { id: 3, category: 'Backend', name: 'FastAPI' }
];

const mockProjects = [
  {
    id: 1,
    title: 'CenterFusionDetect3D',
    description: 'Autonomous vehicle sensor fusion',
    link: 'https://github.com/demo/fusion',
    date_start: '2023-01',
    date_end: '2023-08',
    image_url: 'https://pub-r2.dev/projects/sample.jpg',
    tags: ['PyTorch', 'ROS2'],
    tier: 'featured',
    sort_order: 1,
    visual_type: 'image',
    is_confidential: false,
    repo_visibility: 'public',
    metrics: { accuracy: '98.2%' }
  },
  {
    id: 2,
    title: 'Confidential Fintech Fraud Classifier',
    description: 'Proprietary enterprise fraud detection',
    link: 'https://github.com/client-internal/private-repo',
    date_start: '2023-09',
    date_end: '2024-02',
    image_url: 'https://pub-r2.dev/projects/confidential.jpg',
    tags: ['XGBoost', 'Kafka'],
    tier: 'standard',
    sort_order: 2,
    visual_type: 'image',
    is_confidential: true,
    repo_visibility: 'private',
    metrics: { fraud_loss_reduction: '$12M', precision: '99.1%' }
  }
];

const mockExperience = [
  {
    id: 1,
    role: 'Lead AI Engineer',
    company: 'Neural Robotics Corp',
    date_range: '2022 - Present',
    description: 'Architecting multimodal vision perception systems.',
    tech_stack: ['PyTorch', 'CUDA', 'Python'],
    sort_order: 1
  }
];

const mockCertificates = [
  {
    id: 1,
    title: 'Deep Learning Specialization',
    issuer: 'DeepLearning.AI',
    date: '2022-05',
    image_url: 'https://pub-r2.dev/certificates/sample.jpg',
    credential_id: 'CERT-12345',
    category: 'Certificate',
    tier: 'featured',
    sort_order: 1
  },
  {
    id: 2,
    title: 'NeurIPS Workshop Best Paper',
    issuer: 'NeurIPS',
    date: '2023-12',
    image_url: 'https://pub-r2.dev/certificates/paper.jpg',
    credential_id: 'PAPER-6789',
    category: 'Paper',
    tier: 'standard',
    sort_order: 2
  }
];

const createMockSql = (overrides = {}) => {
  return vi.fn((strings, ...values) => {
    const query = strings[0];
    if (query.includes('FROM profile')) return Promise.resolve(overrides.profile || [mockProfile]);
    if (query.includes('FROM skills')) return Promise.resolve(overrides.skills || mockSkills);
    if (query.includes('FROM projects')) return Promise.resolve(overrides.projects || mockProjects);
    if (query.includes('FROM experience')) return Promise.resolve(overrides.experience || mockExperience);
    if (query.includes('FROM certificates')) return Promise.resolve(overrides.certificates || mockCertificates);
    return Promise.resolve([]);
  });
};

describe('Netlify Function: GET /api/portfolio', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    portfolioHandler.__setSql(createMockSql());
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://testuser:secretpassword@ep-test-123.neon.tech/neondb?sslmode=require',
      ADMIN_API_KEY: 'test-admin-secret-key',
      JWT_SECRET: 'test-jwt-secret-key'
    };
  });

  afterEach(() => {
    portfolioHandler.__setSql(null);
    process.env = originalEnv;
  });

  it('handles OPTIONS preflight request with correct CORS headers', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'OPTIONS' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Methods']).toContain('GET');
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'POST' });
    expect(res.statusCode).toBe(405);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Method not allowed');
  });

  it('returns aggregated portfolio payload with expected structure and tiering on GET', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/json');

    const data = JSON.parse(res.body);
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('skills');
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('experience');
    expect(data).toHaveProperty('certificates');
    expect(data).toHaveProperty('tiered_projects');
    expect(data).toHaveProperty('tiered');

    expect(data.profile.name).toBe('Alex Chen');
    expect(data.skills).toHaveLength(3);
    expect(data.projects).toHaveLength(2);
    expect(data.experience).toHaveLength(1);
    expect(data.certificates).toHaveLength(2);

    // Verify structured tier mapping
    expect(data.tiered_projects).toHaveProperty('featured');
    expect(data.tiered_projects).toHaveProperty('standard');
    expect(data.tiered.projects.featured[0].title).toBe('CenterFusionDetect3D');
  });

  it('filters portfolio output by tier when query parameter is specified', async () => {
    const res = await portfolioHandler.handler({ 
      httpMethod: 'GET',
      queryStringParameters: { tier: 'featured' }
    });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);

    expect(data.projects).toHaveLength(1);
    expect(data.projects[0].tier).toBe('featured');
    expect(data.projects[0].title).toBe('CenterFusionDetect3D');

    expect(data.certificates).toHaveLength(1);
    expect(data.certificates[0].tier).toBe('featured');
  });

  it('redacts confidential project links and metrics for public unauthenticated visitors', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    const data = JSON.parse(res.body);

    const publicProject = data.projects.find(p => p.id === 1);
    const confidentialProject = data.projects.find(p => p.id === 2);

    expect(publicProject.is_confidential).toBe(false);
    expect(publicProject.link).toBe('https://github.com/demo/fusion');
    expect(publicProject.metrics).toEqual({ accuracy: '98.2%' });

    // Confidential project must be redacted
    expect(confidentialProject.is_confidential).toBe(true);
    expect(confidentialProject.link).toBeNull();
    expect(confidentialProject.metrics).toEqual({});
  });

  it('preserves confidential links and metrics when accessed with valid admin cookie session', async () => {
    const adminToken = jwt.sign({ id: 1, email: 'admin@test.com' }, 'test-jwt-secret-key');
    const res = await portfolioHandler.handler({ 
      httpMethod: 'GET',
      headers: {
        cookie: `admin_jwt=${adminToken}`
      }
    });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);

    const confidentialProject = data.projects.find(p => p.id === 2);
    expect(confidentialProject.is_confidential).toBe(true);
    expect(confidentialProject.link).toBe('https://github.com/client-internal/private-repo');
    expect(confidentialProject.metrics).toEqual({ fraud_loss_reduction: '$12M', precision: '99.1%' });
  });

  it('preserves confidential links and metrics when accessed with valid x-admin-key header', async () => {
    const res = await portfolioHandler.handler({ 
      httpMethod: 'GET',
      headers: {
        'x-admin-key': 'test-admin-secret-key'
      }
    });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);

    const confidentialProject = data.projects.find(p => p.id === 2);
    expect(confidentialProject.link).toBe('https://github.com/client-internal/private-repo');
    expect(confidentialProject.metrics).toHaveProperty('fraud_loss_reduction');
  });

  it('ensures sensitive credentials and password hashes are never leaked', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    const responseText = res.body;

    expect(responseText).not.toContain('secretpassword');
    expect(responseText).not.toContain('postgresql://');
    expect(responseText).not.toContain('neon.tech');
    expect(responseText).not.toContain('password');
  });

  it('handles database errors gracefully without leaking raw database stack or credentials', async () => {
    portfolioHandler.__setSql(vi.fn().mockRejectedValue(new Error('connection to server at "ep-test-123.neon.tech", port 5432 failed')));

    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(500);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('Failed to fetch portfolio data');
    expect(res.body).not.toContain('ep-test-123.neon.tech');
    expect(res.body).not.toContain('port 5432');
  });

  it('gracefully falls back to legacy columns when new schema columns do not exist yet', async () => {
    const legacyProject = {
      id: 1,
      title: 'Legacy CenterFusion',
      description: 'Legacy description',
      link: 'https://example.com/legacy',
      date_start: '2022-01',
      date_end: '2022-08',
      image_url: 'https://pub-r2.dev/projects/legacy.jpg',
      tags: ['PyTorch']
    };
    const legacyExperience = {
      id: 1,
      role: 'ML Engineer',
      company: 'Tech Corp',
      date_range: '2021 - 2022',
      description: 'Built models',
      tech_stack: ['Python']
    };
    const legacyCert = {
      id: 1,
      title: 'AI Cert',
      issuer: 'DeepLearning',
      date: '2021-05',
      image_url: 'https://pub-r2.dev/certs/sample.jpg',
      credential_id: 'CERT-111'
    };

    portfolioHandler.__setSql(vi.fn((strings) => {
      const query = strings[0];
      if (query.includes('FROM profile')) return Promise.resolve([mockProfile]);
      if (query.includes('FROM skills')) return Promise.resolve(mockSkills);
      if (query.includes('FROM projects')) {
        if (query.includes('tier') || query.includes('sort_order')) {
          return Promise.reject(new Error('column "tier" does not exist'));
        }
        return Promise.resolve([legacyProject]);
      }
      if (query.includes('FROM experience')) {
        if (query.includes('sort_order')) {
          return Promise.reject(new Error('column "sort_order" does not exist'));
        }
        return Promise.resolve([legacyExperience]);
      }
      if (query.includes('FROM certificates')) {
        if (query.includes('category') || query.includes('tier')) {
          return Promise.reject(new Error('column "category" does not exist'));
        }
        return Promise.resolve([legacyCert]);
      }
      return Promise.resolve([]);
    }));

    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);

    expect(data.projects[0].title).toBe('Legacy CenterFusion');
    expect(data.projects[0].tier).toBe('standard');
    expect(data.projects[0].sort_order).toBe(0);
    expect(data.projects[0].visual_type).toBe('image');
    expect(data.projects[0].is_confidential).toBe(false);

    expect(data.experience[0].role).toBe('ML Engineer');
    expect(data.experience[0].sort_order).toBe(0);

    expect(data.certificates[0].title).toBe('AI Cert');
    expect(data.certificates[0].category).toBe('Certificate');
    expect(data.certificates[0].tier).toBe('standard');
  });

  it('handles missing database configuration with HTTP 500 error', async () => {
    portfolioHandler.__setSql(null);
    delete process.env.DATABASE_URL;
    delete process.env.NETLIFY_DATABASE_URL;
    delete process.env.REACT_APP_DATABASE_URL;

    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Database configuration missing');
  });
});

describe('Netlify Function: POST /api/admin/crud', () => {
  const originalEnv = process.env;
  let mockSqlFn;

  beforeEach(() => {
    mockSqlFn = vi.fn().mockResolvedValue([{ id: 10 }]);
    adminCrudHandler.__setSql(mockSqlFn);
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://testuser:secretpassword@ep-test-123.neon.tech/neondb?sslmode=require',
      ADMIN_API_KEY: 'test-admin-secret-key',
      JWT_SECRET: 'test-jwt-secret-key'
    };
  });

  afterEach(() => {
    adminCrudHandler.__setSql(null);
    process.env = originalEnv;
  });

  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await adminCrudHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ action: 'createProject', data: { title: 'Test' } })
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('Unauthorized');
  });

  it('allows authenticated admin via x-admin-key to create project with tiered and NDA fields', async () => {
    const projectData = {
      title: 'Autonomous Navigation System',
      description: 'Lidar SLAM and navigation pipeline',
      link: 'https://example.com/slam',
      tier: 'featured',
      sort_order: 1,
      visual_type: 'image',
      is_confidential: true,
      repo_visibility: 'private',
      metrics: { latency: '15ms', accuracy: '99%' }
    };

    const res = await adminCrudHandler.handler({
      httpMethod: 'POST',
      headers: {
        'x-admin-key': 'test-admin-secret-key'
      },
      body: JSON.stringify({
        action: 'createProject',
        data: projectData
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(mockSqlFn).toHaveBeenCalled();
  });

  it('allows authenticated admin via JWT cookie to update certificate with category and tier', async () => {
    const adminToken = jwt.sign({ id: 1, email: 'admin@test.com' }, 'test-jwt-secret-key');
    const certData = {
      title: 'CVPR Best Paper',
      issuer: 'CVPR',
      date: '2024-06',
      category: 'Paper',
      tier: 'featured',
      sort_order: 0
    };

    const res = await adminCrudHandler.handler({
      httpMethod: 'POST',
      headers: {
        cookie: `admin_jwt=${adminToken}`
      },
      body: JSON.stringify({
        action: 'updateCertificate',
        id: 5,
        data: certData
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(mockSqlFn).toHaveBeenCalled();
  });

  it('allows authenticated admin to delete experience entry', async () => {
    const res = await adminCrudHandler.handler({
      httpMethod: 'POST',
      headers: {
        'x-admin-key': 'test-admin-secret-key'
      },
      body: JSON.stringify({
        action: 'deleteExperience',
        id: 3
      })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });
});

describe('Frontend API Service: /api/portfolio consumption & CRUD', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchPortfolioData calls /api/portfolio and passes tier filter query parameter', async () => {
    const mockPayload = {
      profile: mockProfile,
      skills: mockSkills,
      projects: mockProjects,
      experience: mockExperience,
      certificates: mockCertificates,
      tiered_projects: { featured: [mockProjects[0]] }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPayload
    });

    const data = await fetchPortfolioData({ tier: 'featured' });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/portfolio?tier=featured'));
    expect(data.profile.name).toBe('Alex Chen');
  });

  it('getTieredProjects returns tiered grouping from portfolio data', async () => {
    const mockPayload = {
      projects: mockProjects,
      tiered_projects: {
        featured: [mockProjects[0]],
        standard: [mockProjects[1]]
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPayload
    });

    const tiered = await getTieredProjects();
    expect(tiered).toHaveProperty('featured');
    expect(tiered).toHaveProperty('standard');
    expect(tiered.featured[0].title).toBe('CenterFusionDetect3D');
  });

  it('getProjects, getSkills, getExperience, getCertificates, getProfile consume portfolio data', async () => {
    const mockPayload = {
      profile: mockProfile,
      skills: mockSkills,
      projects: mockProjects,
      experience: mockExperience,
      certificates: mockCertificates
    };

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload
    });

    const [projects, skills, experience, certs, profile] = await Promise.all([
      getProjects(),
      getSkills(),
      getExperience(),
      getCertificates(),
      getProfile()
    ]);

    expect(projects).toEqual(mockProjects);
    expect(skills).toEqual(mockSkills);
    expect(experience).toEqual(mockExperience);
    expect(certs).toEqual(mockCertificates);
    expect(profile).toEqual(mockProfile);
  });

  it('admin CRUD methods (addProject, updateProject, deleteProject, etc.) route to /api/admin/crud', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: [{ id: 99, title: 'Test CRUD' }] })
    });

    const addRes = await addProject({ title: 'Test CRUD', tier: 'standard' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/crud'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.stringContaining('"action":"addProject"')
      })
    );
    expect(addRes).toEqual([{ id: 99, title: 'Test CRUD' }]);

    await updateProject(99, { title: 'Updated' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/crud'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"updateProject"')
      })
    );

    await deleteProject(99);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/crud'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"deleteProject"')
      })
    );

    await updateProfile({ id: 1, name: 'Alex' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/crud'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"updateProfile"')
      })
    );
  });
});

describe('Database Migration Runner', () => {
  it('initializes schema_migrations table and executes all migrations including 005', async () => {
    const { migrate, MIGRATIONS } = await import('../../scripts/migrate_db');

    expect(Array.isArray(MIGRATIONS)).toBe(true);
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(5);

    // Verify migration 005 exists in migration list
    const migration005 = MIGRATIONS.find(m => m.name === '005_tiered_content_and_nda_metadata');
    expect(migration005).toBeDefined();

    const executedQueries = [];
    const mockClient = {
      query: vi.fn(async (queryText, params) => {
        executedQueries.push(typeof queryText === 'string' ? queryText : queryText?.text || '');
        if (typeof queryText === 'string' && queryText.includes('SELECT name FROM schema_migrations')) {
          return { rows: [] }; // No migrations applied yet
        }
        if (typeof queryText === 'string' && queryText.includes('SELECT id FROM admins')) {
          return { rows: [] };
        }
        if (typeof queryText === 'string' && queryText.includes('SELECT id FROM skills')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: vi.fn()
    };

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      end: vi.fn()
    };

    const result = await migrate(mockPool);

    expect(result.applied).toContain('001_create_core_tables');
    expect(result.applied).toContain('002_add_resume_and_image_urls');
    expect(result.applied).toContain('005_tiered_content_and_nda_metadata');

    // Ensure schema_migrations table creation was executed
    const hasSchemaMigrationsCreation = executedQueries.some(q => q.includes('CREATE TABLE IF NOT EXISTS schema_migrations'));
    expect(hasSchemaMigrationsCreation).toBe(true);
  });

  it('guarantees idempotency when run a second time against an already-migrated database', async () => {
    const { migrate, MIGRATIONS } = await import('../../scripts/migrate_db');

    // Simulate database where all migrations are already recorded
    const mockClient = {
      query: vi.fn(async (queryText) => {
        if (typeof queryText === 'string' && queryText.includes('SELECT name FROM schema_migrations')) {
          return { rows: MIGRATIONS.map(m => ({ name: m.name })) };
        }
        return { rows: [] };
      }),
      release: vi.fn()
    };

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      end: vi.fn()
    };

    const result = await migrate(mockPool);

    // No new migrations should be applied
    expect(result.applied).toHaveLength(0);
    // All migrations should be skipped
    expect(result.skipped).toContain('005_tiered_content_and_nda_metadata');
  });

  it('loadSqlMigrations parses and returns sql migration files from migrations directory', async () => {
    const { loadSqlMigrations } = await import('../../scripts/migrate_db');
    const sqlMigrations = loadSqlMigrations();

    expect(Array.isArray(sqlMigrations)).toBe(true);
    expect(sqlMigrations.length).toBeGreaterThanOrEqual(1);

    const m005 = sqlMigrations.find(m => m.name === '005_tiered_content_and_nda_metadata');
    expect(m005).toBeDefined();
    expect(typeof m005.up).toBe('function');
  });
});

describe('Vite Server Proxy Configuration', () => {
  it('correctly maps /api/admin/crud to /.netlify/functions/admin-crud before generic /api fallback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.resolve(__dirname, '../../vite.config.js');
    const content = fs.readFileSync(configPath, 'utf8');

    // Verify /api/admin/crud proxy definition exists
    expect(content).toContain("'/api/admin/crud'");
    expect(content).toContain("rewrite: () => '/.netlify/functions/admin-crud'");

    // Verify proxy ordering: /api/admin/crud must appear before generic '/api' fallback
    const crudIndex = content.indexOf("'/api/admin/crud':");
    const apiIndex = content.indexOf("'/api':");
    expect(crudIndex).toBeGreaterThan(-1);
    expect(apiIndex).toBeGreaterThan(-1);
    expect(crudIndex).toBeLessThan(apiIndex);
  });
});

