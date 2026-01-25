// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * INSTALLATION INSTRUCTIONS:
 * Run the following commands to set up the test environment:
 * 
 * npm install -D @playwright/test
 * npx playwright install
 * 
 * TO RUN TESTS:
 * npx playwright test
 */

const ADMIN_CREDENTIALS = {
  email: 'hengweibin1898@gmail.com',
  password: 'admin'
};

test.describe('Admin Panel', () => {
  
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
      
      // Save
      // Note: This assumes the backend is running. If not, this step might fail or show an error toast.
      await page.click('button:has-text("Save Changes")');
      
      // Verify Success Toast
      // We use a loose matcher because the toast might say "Added successfully" or similar
      await expect(page.getByText(/Added successfully/i)).toBeVisible();
      
      // Verify it appears in the table
      await expect(page.getByText('E2E Test Project')).toBeVisible();
    });

    test('Edit Project', async ({ page }) => {
      // Ensure we are on Projects tab
      await page.click('button:has-text("Projects")');
      
      // Find the row with our test project and click Edit
      // We filter by text to find the specific row
      const row = page.locator('tr', { hasText: 'E2E Test Project' });
      await row.getByText('Edit').click();
      
      // Verify Modal Open
      await expect(page.getByText('Edit Projects')).toBeVisible();
      
      // Change Title
      await page.fill('input[placeholder="Title"]', 'E2E Test Project Updated');
      
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
      
      // Click Delete in the modal (ConfirmModal uses "Delete" as confirm text)
      // We need to be specific to avoid clicking the table button again if it's still visible
      const modal = page.locator('div').filter({ hasText: 'System Warning' }).last();
      await modal.getByRole('button', { name: 'Delete' }).click();
      
      // Verify Success Toast
      await expect(page.getByText(/Item deleted successfully/i)).toBeVisible();
      
      // Verify it's gone
      await expect(page.getByText('E2E Test Project Updated')).not.toBeVisible();
    });

    test('Update Profile', async ({ page }) => {
      await page.click('button:has-text("Profile")');
      
      // Update Bio
      const bioInput = page.locator('textarea').first(); // Assuming first textarea is Bio based on form order
      await bioInput.fill('Updated bio from E2E test');
      
      // Save
      await page.click('button:has-text("UPDATE SYSTEM PROFILE")');
      
      // Verify Toast
      await expect(page.getByText(/Profile updated successfully/i)).toBeVisible();
    });
  });
});
