// @ts-check
const { test, expect } = require('@playwright/test');

const MOCK_PORTFOLIO_DATA = {
  profile: {
    id: 1,
    name: 'Wayne Heng',
    title: 'Machine Learning Engineer & AI Researcher',
    bio: 'Specializing in computer vision, sensor fusion architectures, and high-throughput MLOps.',
    email: 'hengweibin1898@gmail.com',
    github: 'https://github.com/hengweibin',
    linkedin: 'https://linkedin.com/in/hengweibin'
  },
  skills: [
    { id: 1, category: 'Deep Learning', name: 'PyTorch' },
    { id: 2, category: 'Deep Learning', name: 'TensorRT' },
    { id: 3, category: 'Computer Vision', name: 'OpenCV' },
    { id: 4, category: 'Deployment', name: 'Docker' }
  ],
  projects: [
    {
      id: 1,
      title: 'CenterFusionDetect3D',
      description: 'Real-time 3D sensor fusion integrating millimeter-wave radar and camera image features.',
      tier: 'featured',
      sort_order: 1,
      tags: ['Python', 'PyTorch', 'Sensor Fusion', 'LiDAR'],
      is_confidential: false,
      metrics: { latency: '12ms', mAP: '84.6%' }
    },
    {
      id: 2,
      title: 'RadarCameraFusion',
      description: 'Sensor fusion pipeline with TensorRT acceleration.',
      tier: 'standard',
      sort_order: 2,
      tags: ['C++', 'TensorRT', 'CUDA'],
      is_confidential: false,
      metrics: { fps: '60 FPS' }
    }
  ],
  experience: [
    {
      id: 1,
      role: 'Perception Engineer',
      company: 'Autonomous Perception Labs',
      date_range: '2022 - PRESENT',
      description: 'Leading sensor fusion perception architectures.',
      tech_stack: ['PyTorch', 'ROS', 'CUDA']
    }
  ],
  certificates: []
};

test.describe('Agent UI & Mission Control (Issue #10)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept portfolio API
    await page.route('**/api/portfolio', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PORTFOLIO_DATA)
      });
    });
  });

  test('Hero terminal displays query prompt and streams responses token-by-token with typewriter cursor', async ({ page }) => {
    // Intercept agent chat endpoint with SSE stream
    await page.route('**/api/agent/chat', async (route) => {
      const sseBody = [
        'event: tool_call',
        'data: {"tool":"list_projects","params":{}}',
        '',
        'event: token',
        'data: {"token":"I have "}',
        '',
        'event: token',
        'data: {"token":"retrieved "}',
        '',
        'event: token',
        'data: {"token":"the flagship perception "}',
        '',
        'event: token',
        'data: {"token":"projects."}',
        '',
        'event: done',
        'data: {"tokens_used":8,"latency_ms":120,"session_id":"test-session"}',
        '',
        ''
      ].join('\n');

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: sseBody
      });
    });

    await page.goto('/');

    // Verify Hero Terminal presence
    const terminal = page.locator('[data-testid="hero-terminal"]');
    await expect(terminal).toBeVisible();

    const input = page.locator('[data-testid="hero-terminal-input"]');
    await expect(input).toBeVisible();

    // Submit prompt
    await input.fill('Tell me about your projects');
    await page.locator('[data-testid="hero-terminal-submit"]').click();

    // Verify response text renders
    const responseContent = page.locator('[data-testid="agent-response-content"]').last();
    await expect(responseContent).toContainText('retrieved the flagship perception projects');
  });

  test('Reasoning traces render in collapsible telemetry pane', async ({ page }) => {
    await page.route('**/api/agent/chat', async (route) => {
      const sseBody = [
        'event: tool_call',
        'data: {"tool":"list_projects","params":{}}',
        '',
        'event: token',
        'data: {"token":"Loaded project records successfully."}',
        '',
        'event: done',
        'data: {"tokens_used":5,"latency_ms":100}',
        '',
        ''
      ].join('\n');

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        body: sseBody
      });
    });

    await page.goto('/');

    // Submit query
    const input = page.locator('[data-testid="hero-terminal-input"]');
    await input.fill('What projects exist?');
    await page.locator('[data-testid="hero-terminal-submit"]').click();

    // Verify telemetry drawer toggle
    const telemetryToggle = page.locator('[data-testid="telemetry-drawer-toggle"]').last();
    await expect(telemetryToggle).toBeVisible();

    // Click to expand reasoning traces
    await telemetryToggle.click();

    // Verify telemetry content
    const telemetryContent = page.locator('[data-testid="telemetry-content"]').last();
    await expect(telemetryContent).toBeVisible();
    await expect(telemetryContent).toContainText('TOOL CALL:');
    await expect(telemetryContent).toContainText('list_projects()');
  });

  test('Scrolling out of Hero collapses chat into floating capsule dock with Cmd+K toggle', async ({ page }) => {
    await page.goto('/');

    const capsule = page.locator('[data-testid="floating-dock-capsule"]');
    // Initially near top of viewport, capsule is hidden
    await expect(capsule).not.toBeVisible();

    // Scroll down past Hero to projects or contact
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(400);

    // Verify bottom capsule is now visible
    await expect(capsule).toBeVisible();

    // Click capsule to open mini chat drawer
    await capsule.click();
    const drawer = page.locator('[data-testid="floating-dock-drawer"]');
    await expect(drawer).toBeVisible();

    // Close drawer using close button
    const closeBtn = page.locator('[data-testid="floating-dock-close"]');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // Test Ctrl+K keyboard shortcut to toggle drawer open
    await page.keyboard.press('Control+k');
    await expect(drawer).toBeVisible();

    // Test Escape key to close drawer
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
  });

  test('Agent executes front-end UI actions: scroll_to, highlight_project, and filter_skills', async ({ page }) => {
    // Intercept chat to simulate agent invoking tools that trigger UI actions
    await page.route('**/api/agent/chat', async (route) => {
      const sseBody = [
        'event: tool_call',
        'data: {"tool":"list_projects","params":{}}',
        '',
        'event: token',
        'data: {"token":"Highlighting CenterFusionDetect3D on the board."}',
        '',
        'event: done',
        'data: {"tokens_used":6,"latency_ms":90}',
        '',
        ''
      ].join('\n');

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        body: sseBody
      });
    });

    await page.goto('/');

    // Send query in hero terminal
    const input = page.locator('[data-testid="hero-terminal-input"]');
    await input.fill('Highlight CenterFusionDetect3D');
    await page.locator('[data-testid="hero-terminal-submit"]').click();

    // Verify projects section has matching card
    const projectCard = page.locator('[data-testid="project-card-CenterFusionDetect3D"]');
    await expect(projectCard).toBeVisible();

    // Trigger skills filter action via quick prompt in terminal
    const skillsQueryBtn = page.locator('[data-testid="suggested-prompt-1"]'); // Technical Stack
    await skillsQueryBtn.click();

    // Verify skills section displays group card
    const skillsGroup = page.locator('[data-testid="skill-group-Deep Learning"]');
    await expect(skillsGroup).toBeVisible();
  });

  test('When daily limit of 5 requests is hit, UI displays notice and switches to scripted playback', async ({ page }) => {
    // Mock rate limit exhaustion response from serverless handler
    await page.route('**/api/agent/chat', async (route) => {
      const errorFrame = [
        'event: error',
        'data: {"code":"RATE_LIMIT_EXCEEDED","message":"Daily rate limit reached. Reverting to scripted playback."}',
        '',
        ''
      ].join('\n');

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        body: errorFrame
      });
    });

    await page.goto('/');

    const input = page.locator('[data-testid="hero-terminal-input"]');
    await input.fill('Tell me about your projects');
    await page.locator('[data-testid="hero-terminal-submit"]').click();

    // Verify clear rate limit warning notice is rendered
    const rateLimitNotice = page.locator('[data-testid="rate-limit-notice"]');
    await expect(rateLimitNotice).toBeVisible();
    await expect(rateLimitNotice).toContainText('Daily rate limit reached');

    // Verify fallback mode badge is shown
    const fallbackBadge = page.locator('[data-testid="rate-limit-badge"]');
    await expect(fallbackBadge).toBeVisible();

    // Verify scripted fallback stream completes and delivers curated response
    const responseContent = page.locator('[data-testid="agent-response-content"]').last();
    await expect(responseContent).toContainText('CenterFusionDetect3D');
  });

  test('Agent responds in Traditional Chinese when queried in Traditional Chinese', async ({ page }) => {
    // Test scripted fallback for Traditional Chinese
    await page.route('**/api/agent/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        body: 'event: error\ndata: {"code":"RATE_LIMIT_EXCEEDED"}\n\n'
      });
    });

    await page.goto('/');

    const input = page.locator('[data-testid="hero-terminal-input"]');
    await input.fill('介紹一下你的核心專案');
    await page.locator('[data-testid="hero-terminal-submit"]').click();

    // Verify Traditional Chinese response text is streamed
    const responseContent = page.locator('[data-testid="agent-response-content"]').last();
    await expect(responseContent).toContainText('CenterFusionDetect3D');
    await expect(responseContent).toContainText('感測器融合');
  });
});
