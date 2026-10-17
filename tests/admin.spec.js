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

      const floatingBar = page.getByTestId('floating-action-bar');
      await expect(floatingBar).toBeVisible();
      await expect(floatingBar).toContainText('1 item modified');

      // Test sort order controls (Move Up / Down)
      const moveUpBtn = page.locator('button[title="Move Up (Decrease sort_order)"]').first();
      projectsList[0].sort_order = 0;
      await moveUpBtn.click();

      // Save staged changes via Floating Action Bar
      await floatingBar.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText(/Changes saved successfully/i)).toBeVisible();
      await expect(floatingBar).not.toBeVisible();
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

      const floatingBar = page.getByTestId('floating-action-bar');
      await expect(floatingBar).toBeVisible();

      // Sort order down button
      const moveDownBtn = page.locator('button[title="Move Down"]').first();
      certificatesList[0].sort_order = 1;
      await moveDownBtn.click();

      // Save staged changes via Floating Action Bar
      await floatingBar.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText(/Changes saved successfully/i)).toBeVisible();
      await expect(floatingBar).not.toBeVisible();
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

  test.describe('Batch Save, Staging & Navigation Guards', () => {
    test.beforeEach(async ({ page }) => {
      projectsList = [
        {
          id: 10,
          title: 'Perception Model A',
          description: 'Radar and LiDAR perception',
          link: 'https://example.com/a',
          tier: 'featured',
          sort_order: 0,
        },
        {
          id: 20,
          title: 'Inference Pipeline B',
          description: 'High throughput pipeline',
          link: 'https://example.com/b',
          tier: 'standard',
          sort_order: 1,
        },
        {
          id: 30,
          title: 'Edge Deployment C',
          description: 'Embedded runtime model',
          link: 'https://example.com/c',
          tier: 'foundation',
          sort_order: 2,
        }
      ];

      certificatesList = [
        {
          id: 201,
          title: 'Deep Learning Specialization',
          issuer: 'DeepLearning.AI',
          date: '2024-01-15',
          credential_id: 'CERT-12345',
          category: 'Certificate',
          tier: 'standard',
          sort_order: 0
        }
      ];

      experienceList = [
        {
          id: 301,
          role: 'Machine Learning Engineer',
          company: 'Autonomous Systems Inc.',
          date_range: '2023 - Present',
          description: 'Designed radar perception pipelines',
          sort_order: 0
        }
      ];

      // Login to reach the dashboard
      await page.goto('/admin/login');
      await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.click('button:has-text("LOGIN")');
      await expect(page.getByText('Control Panel')).toBeVisible();
      await expect(page.getByText('Projects Management')).toBeVisible();
    });

    test('Staging: modifying Tier or clicking sort buttons updates the DOM immediately with ZERO network requests', async ({ page }) => {
      let crudCalls = 0;
      await page.route('**/api/admin/crud', async (route) => {
        crudCalls++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, result: [] })
        });
      });

      // Modify tier for Perception Model A
      const tierSelect = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelect.selectOption('archive');
      await expect(tierSelect).toHaveValue('archive');

      // Click Move Down for Perception Model A
      const moveDownBtn = page.locator('tr:has-text("Perception Model A") button[title="Move Down (Increase sort_order)"]');
      await moveDownBtn.click();

      // Check DOM reordered immediately: Inference Pipeline B should now appear before Perception Model A
      const rows = page.locator('tbody tr');
      await expect(rows.nth(0)).toContainText('Inference Pipeline B');
      await expect(rows.nth(1)).toContainText('Perception Model A');

      // Zero mutation requests should have been sent to /api/admin/crud
      expect(crudCalls).toBe(0);
    });

    test('Floating Action Bar: appears when dirty, displays correct count, and shows row dirty indicator', async ({ page }) => {
      const floatingBar = page.getByTestId('floating-action-bar');
      await expect(floatingBar).not.toBeVisible();

      // Initially no dirty rows
      await expect(page.locator('tr[data-dirty="true"]')).toHaveCount(0);

      // Modify 1 item: change tier of Perception Model A
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelectA.selectOption('standard');

      // Floating bar appears with 1 item modified
      await expect(floatingBar).toBeVisible();
      await expect(floatingBar).toContainText('1 item modified');

      // Verify row dirty indicator on Perception Model A row
      const rowA = page.locator('tr:has-text("Perception Model A")');
      await expect(rowA).toHaveAttribute('data-dirty', 'true');
      await expect(rowA.getByTestId('dirty-indicator')).toBeVisible();

      // Other row remains not dirty
      const rowB = page.locator('tr:has-text("Inference Pipeline B")');
      await expect(rowB).not.toHaveAttribute('data-dirty', 'true');
      await expect(rowB.getByTestId('dirty-indicator')).not.toBeVisible();

      // Modify a second item: change tier of Inference Pipeline B
      const tierSelectB = page.locator('select[aria-label="Tier for Inference Pipeline B"]');
      await tierSelectB.selectOption('featured');

      // Floating bar updates to 2 items modified
      await expect(floatingBar).toContainText('2 items modified');
      await expect(rowB).toHaveAttribute('data-dirty', 'true');
      await expect(rowB.getByTestId('dirty-indicator')).toBeVisible();
    });

    test('Discard: clicking Discard resets items to original order/tier and hides floating bar without contacting backend', async ({ page }) => {
      let crudCalls = 0;
      await page.route('**/api/admin/crud', async (route) => {
        crudCalls++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, result: [] })
        });
      });

      const floatingBar = page.getByTestId('floating-action-bar');
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');

      // Make dirty changes: change tier and swap order
      await tierSelectA.selectOption('archive');
      const moveDownBtn = page.locator('tr:has-text("Perception Model A") button[title="Move Down (Increase sort_order)"]');
      await moveDownBtn.click();

      // Verify dirty state
      await expect(floatingBar).toBeVisible();
      const rows = page.locator('tbody tr');
      await expect(rows.nth(0)).toContainText('Inference Pipeline B');

      // Click Discard
      const discardBtn = floatingBar.getByRole('button', { name: 'Discard' });
      await discardBtn.click();

      // Floating bar hides
      await expect(floatingBar).not.toBeVisible();

      // Ordering is restored to original
      await expect(rows.nth(0)).toContainText('Perception Model A');
      await expect(rows.nth(1)).toContainText('Inference Pipeline B');

      // Tier value is restored
      await expect(tierSelectA).toHaveValue('featured');

      // Dirty indicators are gone
      await expect(page.locator('tr[data-dirty="true"]')).toHaveCount(0);

      // Backend was never contacted
      expect(crudCalls).toBe(0);
    });

    test('Batch Save: clicking Save Changes dispatches /api/admin/crud only for dirty items in parallel, displays toast, and dismisses bar', async ({ page }) => {
      const crudRequests = [];
      await page.route('**/api/admin/crud', async (route) => {
        const body = route.request().postDataJSON() || {};
        crudRequests.push(body);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, result: [body.data || {}] })
        });
      });

      const floatingBar = page.getByTestId('floating-action-bar');

      // Modify only Perception Model A (id: 10)
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelectA.selectOption('archive');

      await expect(floatingBar).toBeVisible();
      await expect(floatingBar).toContainText('1 item modified');

      // Click Save Changes
      const saveBtn = floatingBar.getByRole('button', { name: 'Save Changes' });
      await saveBtn.click();

      // Success toast appears
      await expect(page.getByText('Changes saved successfully')).toBeVisible();

      // Floating bar dismisses
      await expect(floatingBar).not.toBeVisible();

      // Dirty indicators cleared
      await expect(page.locator('tr[data-dirty="true"]')).toHaveCount(0);

      // Only 1 update request sent to /api/admin/crud (diff-only)
      expect(crudRequests.length).toBe(1);
      expect(crudRequests[0].id).toBe(10);
      expect(crudRequests[0].data.tier).toBe('archive');
    });

    test('Tab Switching Navigation Guard: Cancel closes modal, remains on current tab with dirty state intact', async ({ page }) => {
      const floatingBar = page.getByTestId('floating-action-bar');
      const guardModal = page.getByTestId('unsaved-changes-modal');

      // Modify tier to create dirty state
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelectA.selectOption('archive');
      await expect(floatingBar).toBeVisible();

      // Attempt to switch to Certificates tab
      await page.click('button:has-text("Certificates")');

      // Guard modal is shown
      await expect(guardModal).toBeVisible();
      await expect(guardModal).toContainText('Unsaved Changes');

      // Click Cancel
      await guardModal.getByRole('button', { name: 'Cancel' }).click();

      // Modal closed, still on Projects tab
      await expect(guardModal).not.toBeVisible();
      await expect(page.getByText('Projects Management')).toBeVisible();
      await expect(page.getByText('Certificates Management')).not.toBeVisible();

      // Staged changes remain intact and floating bar is still visible
      await expect(floatingBar).toBeVisible();
      await expect(tierSelectA).toHaveValue('archive');
    });

    test('Tab Switching Navigation Guard: Discard & Proceed discards changes and switches to target tab', async ({ page }) => {
      const floatingBar = page.getByTestId('floating-action-bar');
      const guardModal = page.getByTestId('unsaved-changes-modal');

      // Modify tier to create dirty state
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelectA.selectOption('archive');
      await expect(floatingBar).toBeVisible();

      // Attempt to switch to Certificates tab
      await page.click('button:has-text("Certificates")');
      await expect(guardModal).toBeVisible();

      // Click Discard & Proceed
      await guardModal.getByRole('button', { name: 'Discard & Proceed' }).click();

      // Guard modal closes and active tab transitions to Certificates
      await expect(guardModal).not.toBeVisible();
      await expect(page.getByText('Certificates Management')).toBeVisible();

      // Switch back to Projects tab and verify changes were discarded
      await page.click('button:has-text("Projects")');
      await expect(page.getByText('Projects Management')).toBeVisible();
      await expect(floatingBar).not.toBeVisible();
      await expect(page.locator('select[aria-label="Tier for Perception Model A"]')).toHaveValue('featured');
    });

    test('Tab Switching Navigation Guard: Save & Proceed batch saves changes and switches to target tab', async ({ page }) => {
      const crudRequests = [];
      await page.route('**/api/admin/crud', async (route) => {
        const body = route.request().postDataJSON() || {};
        crudRequests.push(body);
        if (body.id && body.data) {
          const item = projectsList.find((p) => p.id === body.id);
          if (item) Object.assign(item, body.data);
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, result: [body.data || {}] })
        });
      });

      const floatingBar = page.getByTestId('floating-action-bar');
      const guardModal = page.getByTestId('unsaved-changes-modal');

      // Modify tier to create dirty state
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelectA.selectOption('archive');
      await expect(floatingBar).toBeVisible();

      // Attempt to switch to Certificates tab
      await page.click('button:has-text("Certificates")');
      await expect(guardModal).toBeVisible();

      // Click Save & Proceed
      await guardModal.getByRole('button', { name: 'Save & Proceed' }).click();

      // Toast appears, modal closes, and tab transitions
      await expect(page.getByText('Changes saved successfully')).toBeVisible();
      await expect(guardModal).not.toBeVisible();
      await expect(page.getByText('Certificates Management')).toBeVisible();

      // Verify batch save called backend
      expect(crudRequests.length).toBe(1);
      expect(crudRequests[0].id).toBe(10);
      expect(crudRequests[0].data.tier).toBe('archive');

      // Switch back to Projects tab and verify changes persisted without floating bar
      await page.click('button:has-text("Projects")');
      await expect(page.getByText('Projects Management')).toBeVisible();
      await expect(floatingBar).not.toBeVisible();
      await expect(page.locator('select[aria-label="Tier for Perception Model A"]')).toHaveValue('archive');
    });

    test('Modal Action Collision Guard: clicking + New Entry, Edit, or Delete displays UnsavedChangesModal', async ({ page }) => {
      const floatingBar = page.getByTestId('floating-action-bar');
      const guardModal = page.getByTestId('unsaved-changes-modal');

      // Modify tier to enter dirty state
      const tierSelectA = page.locator('select[aria-label="Tier for Perception Model A"]');
      await tierSelectA.selectOption('archive');
      await expect(floatingBar).toBeVisible();

      // 1. Try clicking "+ New Entry"
      await page.click('button:has-text("+ New Entry")');
      await expect(guardModal).toBeVisible();
      await expect(page.getByText('Add Projects')).not.toBeVisible();

      // Cancel collision guard
      await guardModal.getByRole('button', { name: 'Cancel' }).click();
      await expect(guardModal).not.toBeVisible();
      await expect(page.getByText('Add Projects')).not.toBeVisible();

      // 2. Try clicking "Edit" on a row
      const rowA = page.locator('tr:has-text("Perception Model A")');
      await rowA.getByRole('button', { name: 'Edit' }).click();
      await expect(guardModal).toBeVisible();
      await expect(page.getByText('Edit Projects')).not.toBeVisible();

      // Cancel collision guard
      await guardModal.getByRole('button', { name: 'Cancel' }).click();
      await expect(guardModal).not.toBeVisible();
      await expect(page.getByText('Edit Projects')).not.toBeVisible();

      // 3. Try clicking "Delete" on a row
      await rowA.getByRole('button', { name: 'Delete' }).click();
      await expect(guardModal).toBeVisible();
      await expect(page.getByText('Delete Item')).not.toBeVisible();

      // Cancel collision guard
      await guardModal.getByRole('button', { name: 'Cancel' }).click();
      await expect(guardModal).not.toBeVisible();
      await expect(page.getByText('Delete Item')).not.toBeVisible();
      await expect(floatingBar).toBeVisible();
    });
  });
});
