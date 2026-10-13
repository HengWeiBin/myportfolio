import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPortfolioData, getProjects, getCertificates, getSkills, getExperience, getProfile } from './api';
import portfolioHandler from '../../netlify/functions/portfolio';

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
    tags: ['PyTorch', 'ROS2']
  }
];

const mockExperience = [
  {
    id: 1,
    role: 'Lead AI Engineer',
    company: 'Neural Robotics Corp',
    date_range: '2022 - Present',
    description: 'Architecting multimodal vision perception systems.',
    tech_stack: ['PyTorch', 'CUDA', 'Python']
  }
];

const mockCertificates = [
  {
    id: 1,
    title: 'Deep Learning Specialization',
    issuer: 'DeepLearning.AI',
    date: '2022-05',
    image_url: 'https://pub-r2.dev/certificates/sample.jpg',
    credential_id: 'CERT-12345'
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
      DATABASE_URL: 'postgresql://testuser:secretpassword@ep-test-123.neon.tech/neondb?sslmode=require'
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

  it('returns aggregated portfolio payload with expected structure on GET', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/json');

    const data = JSON.parse(res.body);
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('skills');
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('experience');
    expect(data).toHaveProperty('certificates');

    expect(data.profile.name).toBe('Alex Chen');
    expect(data.skills).toHaveLength(3);
    expect(data.projects).toHaveLength(1);
    expect(data.experience).toHaveLength(1);
    expect(data.certificates).toHaveLength(1);
  });

  it('ensures sensitive credentials and password hashes are never leaked', async () => {
    const res = await portfolioHandler.handler({ httpMethod: 'GET' });
    const responseText = res.body;

    // Database connection secrets must never appear in response body
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
    // Ensure sensitive details from the error are omitted
    expect(res.body).not.toContain('ep-test-123.neon.tech');
    expect(res.body).not.toContain('port 5432');
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

describe('Frontend API Service: /api/portfolio consumption', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchPortfolioData calls /api/portfolio and returns JSON', async () => {
    const mockPayload = {
      profile: mockProfile,
      skills: mockSkills,
      projects: mockProjects,
      experience: mockExperience,
      certificates: mockCertificates
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPayload
    });

    const data = await fetchPortfolioData();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/portfolio'));
    expect(data.profile.name).toBe('Alex Chen');
    expect(data.projects[0].title).toBe('CenterFusionDetect3D');
  });

  it('fetchPortfolioData throws error on non-OK response status', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(fetchPortfolioData()).rejects.toThrow('Failed to fetch portfolio data: 500 Internal Server Error');
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
});

describe('Database Migration Runner', () => {
  it('initializes schema_migrations table and executes pending migrations', async () => {
    const { migrate, MIGRATIONS } = await import('../../scripts/migrate_db');

    expect(Array.isArray(MIGRATIONS)).toBe(true);
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(2);

    const executedQueries = [];
    const mockClient = {
      query: vi.fn(async (queryText, params) => {
        executedQueries.push(typeof queryText === 'string' ? queryText : queryText.text);
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

    // Ensure schema_migrations table creation was executed
    const hasSchemaMigrationsCreation = executedQueries.some(q => q.includes('CREATE TABLE IF NOT EXISTS schema_migrations'));
    expect(hasSchemaMigrationsCreation).toBe(true);
  });
});
