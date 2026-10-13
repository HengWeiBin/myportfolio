// @ts-check
const { test, expect } = require('@playwright/test');

const ADMIN_CREDENTIALS = {
  email: 'hengweibin1898@gmail.com',
  password: 'admin'
};

test.describe('Admin Panel', () => {
  let projectsList = [];
  let currentProfile = {
    name: 'Wayne Heng',
    title: 'Machine Learning Engineer',
    bio: 'Initial bio',
    email: ADMIN_CREDENTIALS.email
  };

  test.beforeEach(async ({ page, context }) => {
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
          skills: [],
          projects: projectsList,
          experience: [],
          certificates: []
        })
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
  });
});
