// @ts-check
const { test, expect } = require('@playwright/test');

const ADMIN_CREDENTIALS = {
  email: 'hengweibin1898@gmail.com',
  password: 'admin'
};

test.describe('Admin Panel', () => {
  let projectsList = [];
  let certificatesList = [];
  let experienceList = [];
  let skillsList = [];
  let currentProfile = {
    name: 'Wayne Heng',
    title: 'Machine Learning Engineer',
    bio: 'Initial bio',
    email: ADMIN_CREDENTIALS.email
  };
  let activeLlmConfig = {
    id: 1,
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    model_name: 'gemini-1.5-flash',
    base_url: '',
    api_key_masked: '••••8492',
    system_prompt: 'You are an AI portfolio assistant for the software and machine learning engineer.',
    daily_rate_limit: 5,
    is_active: true
  };
  let conversationsList = [
    {
      id: 'conv-101',
      session_id: 'sess-alpha-77',
      ip_hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      prompt: 'Explain the 3D LiDAR and Radar perception models',
      response: 'Wayne designed CenterFusionDetect3D integrating millimeter-wave radar point clouds.',
      tool_trace: [{ tool: 'list_projects', params: {}, result: [{ title: 'CenterFusionDetect3D' }] }],
      latency_ms: 142,
      tokens_used: 115,
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'conv-102',
      session_id: 'sess-beta-88',
      ip_hash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c',
      prompt: 'What are your core engineering competencies?',
      response: 'Specialized in PyTorch, CUDA kernel optimization, and high-throughput deployment.',
      tool_trace: [{ tool: 'list_skills', params: {}, result: [{ name: 'PyTorch' }] }],
      latency_ms: 120,
      tokens_used: 88,
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  test.beforeEach(async ({ page, context }) => {
    // Reset state before each test
    activeLlmConfig = {
      id: 1,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      model_name: 'gemini-1.5-flash',
      base_url: '',
      api_key_masked: '••••8492',
      system_prompt: 'You are an AI portfolio assistant for the software and machine learning engineer.',
      daily_rate_limit: 5,
      is_active: true
    };
    // Intercept serverless authentication endpoints
    await page.route('**/api/auth/login', async (route) => {
      const data = route.request().postDataJSON();
      if (data && data.email === ADMIN_CREDENTIALS.email && data.password === ADMIN_CREDENTIALS.password) {
        await context.addCookies([{
          name: 'admin_jwt',
          value: 'mock-valid-admin-jwt',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        }]);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Set-Cookie': 'admin_jwt=mock-valid-admin-jwt; Path=/; HttpOnly; SameSite=Lax',
          },
          body: JSON.stringify({
            success: true,
            user: { id: 1, email: ADMIN_CREDENTIALS.email }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          })
        });
      }
    });

    await page.route('**/api/auth/session', async (route) => {
      const cookies = await context.cookies();
      const hasJwt = cookies.some((c) => c.name === 'admin_jwt');
      if (hasJwt) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            user: { id: 1, email: ADMIN_CREDENTIALS.email }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: false
          })
        });
      }
    });

    await page.route('**/api/auth/logout', async (route) => {
      await context.clearCookies();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie': 'admin_jwt=; Path=/; Max-Age=0; HttpOnly',
        },
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully'
        })
      });
    });

    await page.route('**/api/portfolio', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: currentProfile,
          skills: skillsList,
          projects: projectsList,
          experience: experienceList,
          certificates: certificatesList
        })
      });
    });

    await page.route('**/api/admin/llm/config', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, config: activeLlmConfig })
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() || {};
        activeLlmConfig = {
          ...activeLlmConfig,
          provider: body.provider || activeLlmConfig.provider,
          model: body.model || activeLlmConfig.model,
          model_name: body.model || activeLlmConfig.model,
          base_url: body.base_url !== undefined ? body.base_url : activeLlmConfig.base_url,
          system_prompt: body.system_prompt !== undefined ? body.system_prompt : activeLlmConfig.system_prompt,
          daily_rate_limit: body.daily_rate_limit ? Number(body.daily_rate_limit) : activeLlmConfig.daily_rate_limit,
          api_key_masked: body.api_key && !body.api_key.startsWith('••••') ? '••••' + body.api_key.slice(-4) : activeLlmConfig.api_key_masked
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'LLM configuration updated successfully', config: activeLlmConfig })
        });
      }
    });

    await page.route('**/api/admin/llm/test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          latency_ms: 142,
          reply: 'LLM provider connection successful'
        })
      });
    });

    await page.route('**/api/admin/conversations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversations: conversationsList
        })
      });
    });

    await page.route('**/api/admin/crud', async (route) => {
      const body = route.request().postDataJSON() || {};
      const { data = {} } = body;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, result: [data] })
      });
    });
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText('ROOT ACCESS')).toBeVisible();
  });

  test('Invalid credentials displays error message', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button:has-text("LOGIN")');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('Login Flow', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Check initial state
    await expect(page.getByText('ROOT ACCESS')).toBeVisible();
    
    // Fill login form
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    
    // Submit
    await page.click('button:has-text("LOGIN")');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText('Control Panel')).toBeVisible();
    
    // Verify localStorage
    const localStorage = await page.evaluate(() => window.localStorage.getItem('admin_user'));
    expect(localStorage).toBeTruthy();
  });

  test.describe.serial('Dashboard Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/admin/login');
      await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.click('button:has-text("LOGIN")');
      await expect(page.getByText('Control Panel')).toBeVisible();
    });

    test('Navigation between tabs', async ({ page }) => {
      // Default is Projects
      await expect(page.getByText('Projects Management')).toBeVisible();
      
      // Switch to Certificates
      await page.click('button:has-text("Certificates")');
      await expect(page.getByText('Certificates Management')).toBeVisible();
      
      // Switch to Experience
      await page.click('button:has-text("Experience")');
      await expect(page.getByText('Experience Management')).toBeVisible();
      
      // Switch to Profile
      await page.click('button:has-text("Profile")');
      await expect(page.getByText('Edit User Configuration')).toBeVisible();
    });

    test('Create New Project', async ({ page }) => {
      // Ensure we are on Projects tab
      await page.click('button:has-text("Projects")');
      
      // Open Modal
      await page.click('button:has-text("+ New Entry")');
      await expect(page.getByText('Add Projects')).toBeVisible();
      
      // Fill Form
      await page.fill('input[placeholder="Title"]', 'E2E Test Project');
      await page.fill('textarea[placeholder="Description (Markdown supported)"]', 'This is a test project created by Playwright');
      await page.fill('input[placeholder="Link (URL)"]', 'https://example.com');
      
      // Seed data so fetchData displays new item
      projectsList = [{
        id: 1,
        title: 'E2E Test Project',
        description: 'This is a test project created by Playwright',
        link: 'https://example.com',
        tags: []
      }];

      // Save
      await page.click('button:has-text("Save Changes")');
      
      // Verify Success Toast
      await expect(page.getByText(/Added successfully/i)).toBeVisible();
      
      // Verify it appears in the table
      await expect(page.getByText('E2E Test Project')).toBeVisible();
    });

    test('Edit Project', async ({ page }) => {
      // Ensure we are on Projects tab
      await page.click('button:has-text("Projects")');
      
      // Find the row with our test project and click Edit
      const row = page.locator('tr', { hasText: 'E2E Test Project' });
      await row.getByText('Edit').click();
      
      // Verify Modal Open
      await expect(page.getByText('Edit Projects')).toBeVisible();
      
      // Change Title
      await page.fill('input[placeholder="Title"]', 'E2E Test Project Updated');
      
      if (projectsList.length > 0) {
        projectsList[0].title = 'E2E Test Project Updated';
      }

      // Save
      await page.click('button:has-text("Save Changes")');
      
      // Verify Success Toast
      await expect(page.getByText(/Updated successfully/i)).toBeVisible();
      
      // Verify change in table
      await expect(page.getByText('E2E Test Project Updated')).toBeVisible();
    });

    test('Delete Project', async ({ page }) => {
      // Ensure we are on Projects tab
      await page.click('button:has-text("Projects")');
      
      // Find the row and click Delete
      const row = page.locator('tr', { hasText: 'E2E Test Project Updated' });
      await row.getByText('Delete').click();
      
      // Verify Confirm Modal
      await expect(page.getByText('Are you sure you want to delete this item?')).toBeVisible();
      
      projectsList = [];

      // Click Delete in the modal
      const modal = page.locator('div').filter({ hasText: 'Are you sure you want to delete this item?' }).last();
      await modal.getByRole('button', { name: 'Delete' }).click();
      
      // Verify Success Toast
      await expect(page.getByText(/Item deleted successfully/i)).toBeVisible();
      
      // Verify it's gone
      await expect(page.getByText('E2E Test Project Updated')).not.toBeVisible();
    });

    test('Update Profile', async ({ page }) => {
      await page.click('button:has-text("Profile")');
      
      // Update Bio
      const bioInput = page.locator('textarea').first();
      await bioInput.fill('Updated bio from E2E test');
      
      // Save
      await page.click('button:has-text("UPDATE SYSTEM PROFILE")');
      
      // Verify Toast
      await expect(page.getByText(/Profile updated successfully/i)).toBeVisible();
    });

    test('Split-screen Markdown editor live preview in Project Modal', async ({ page }) => {
      await page.click('button:has-text("Projects")');
      await page.click('button:has-text("+ New Entry")');
      await expect(page.getByText('Add Projects')).toBeVisible();

      // Type Markdown into textarea
      const markdownInput = page.locator('textarea[placeholder="Description (Markdown supported)"]');
      await markdownInput.fill('### Real-time Sensor Fusion\n- 60 FPS Tracking\n- Point cloud clustering');

      // Verify live markdown preview renders heading and items
      const previewPane = page.locator('.prose-invert');
      await expect(previewPane.getByText('Real-time Sensor Fusion')).toBeVisible();
      await expect(previewPane.getByText('60 FPS Tracking')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Cancel")');
      await expect(page.getByText('Add Projects')).not.toBeVisible();
    });

    test('NDA case study attributes, instant tier switching, and sorting on Projects', async ({ page }) => {
      // Seed confidential NDA project
      projectsList = [{
        id: 101,
        title: 'Autonomous Radar Perception',
        description: 'Confidential radar fusion pipeline',
        link: 'https://internal.corp/nda',
        tier: 'featured',
        sort_order: 1,
        visual_type: 'ResultViz',
        is_confidential: true,
        repo_visibility: 'private',
        metrics: { speedup: '4.2x', latency: '12ms' }
      }];

      await page.click('button:has-text("Certificates")');
      await page.click('button:has-text("Projects")');
      await expect(page.getByText('Autonomous Radar Perception')).toBeVisible();

      // Verify NDA badge and repo visibility
      await expect(page.getByText('NDA Protected')).toBeVisible();
      await expect(page.getByText('private repo')).toBeVisible();

      // Test instant tier switching via dropdown
      const tierSelect = page.locator('select[aria-label="Tier for Autonomous Radar Perception"]');
      await expect(tierSelect).toBeVisible();
      projectsList[0].tier = 'foundation';
      await tierSelect.selectOption('foundation');
      await expect(page.getByText(/Updated successfully/i)).toBeVisible();

      // Test sort order controls (Move Up / Down)
      const moveUpBtn = page.locator('button[title="Move Up (Decrease sort_order)"]').first();
      projectsList[0].sort_order = 0;
      await moveUpBtn.click();
      await expect(page.getByText(/Updated successfully/i)).toBeVisible();
    });

    test('Certificates tab with instant tier selector and sort controls', async ({ page }) => {
      certificatesList = [{
        id: 201,
        title: 'Deep Learning Specialization',
        issuer: 'DeepLearning.AI',
        date: '2024-01-15',
        credential_id: 'CERT-12345',
        category: 'Certificate',
        tier: 'standard',
        sort_order: 0
      }];

      await page.click('button:has-text("Certificates")');
      await expect(page.getByText('Certificates Management')).toBeVisible();
      await expect(page.getByText('Deep Learning Specialization')).toBeVisible();

      // Instant tier selector
      const certTierSelect = page.locator('select[aria-label="Tier for Deep Learning Specialization"]');
      certificatesList[0].tier = 'featured';
      await certTierSelect.selectOption('featured');
      await expect(page.getByText(/Updated successfully/i)).toBeVisible();

      // Sort order down button
      const moveDownBtn = page.locator('button[title="Move Down"]').first();
      certificatesList[0].sort_order = 1;
      await moveDownBtn.click();
      await expect(page.getByText(/Updated successfully/i)).toBeVisible();
    });

    test('Skills tab displays categorized technical capabilities', async ({ page }) => {
      skillsList = [{
        id: 301,
        name: 'PyTorch Lightning',
        category: 'DL Frameworks'
      }];

      await page.click('button:has-text("Skills")');
      await expect(page.getByText('Skills Management')).toBeVisible();
      await expect(page.getByText('PyTorch Lightning')).toBeVisible();
      await expect(page.getByText('DL Frameworks')).toBeVisible();
    });

    test('Agent Console: parameter configuration, write-only masked API key, latency test, and telemetry', async ({ page }) => {
      // 1. Switch to Agent Console tab
      await page.click('button:has-text("Agent Console")');
      await expect(page.getByText('LLM Provider & Parameter Configuration')).toBeVisible();

      // 2. Check write-only masked API key
      const apiKeyInput = page.locator('#api-key-input');
      await expect(apiKeyInput).toHaveValue('••••8492');

      // 3. System prompt validation
      await expect(page.getByText('✓ Validated Prompt')).toBeVisible();

      // 4. Test Provider Latency
      const testLatencyBtn = page.locator('button:has-text("Test Provider Latency")');
      await testLatencyBtn.click();
      const latencyBadge = page.locator('[data-testid="latency-badge"]');
      await expect(latencyBadge).toBeVisible();
      await expect(latencyBadge).toContainText('142ms');

      // 5. Update configuration
      const modelInput = page.locator('#model-input');
      await modelInput.fill('gpt-4o-mini');
      const rateLimitInput = page.locator('#rate-limit-input');
      await rateLimitInput.fill('12');

      await page.click('button:has-text("Save Settings")');
      await expect(page.getByText(/LLM configuration saved successfully/i)).toBeVisible();
      expect(activeLlmConfig.model).toBe('gpt-4o-mini');
      expect(activeLlmConfig.daily_rate_limit).toBe(12);

      // 6. Telemetry Table & search filter
      await expect(page.getByText('Anonymized Telemetry Logs')).toBeVisible();
      await expect(page.getByText('Explain the 3D LiDAR and Radar perception models')).toBeVisible();
      await expect(page.getByText('What are your core engineering competencies?')).toBeVisible();

      // Search filter
      const searchInput = page.locator('input[placeholder*="Search prompts"]');
      await searchInput.fill('LiDAR');
      await expect(page.getByText('Explain the 3D LiDAR and Radar perception models')).toBeVisible();
      await expect(page.getByText('What are your core engineering competencies?')).not.toBeVisible();

      // Clear search
      await searchInput.fill('');

      // 7. One-click "Export as Scripted Demo"
      const exportBtn = page.locator('button:has-text("Export as Scripted Demo")').first();
      await exportBtn.click();
      await expect(page.getByText(/Exported as Scripted Demo/i)).toBeVisible();
    });
  });
});
