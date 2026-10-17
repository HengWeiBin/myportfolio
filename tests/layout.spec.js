// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Tailwind v4 Layout & Computed Style Verification (Issue #12)', () => {
  test('verifies .max-w-7xl.mx-auto has non-zero horizontal margins and sections have padding', async ({ page }) => {
    // Set viewport to standard desktop resolution (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Wait for the main page to load
    await expect(page.locator('#home')).toBeVisible();

    // Verify sections have non-zero padding
    const heroSection = page.locator('#home');
    const heroPaddingTop = await heroSection.evaluate((el) => parseFloat(window.getComputedStyle(el).paddingTop));
    const heroPaddingBottom = await heroSection.evaluate((el) => parseFloat(window.getComputedStyle(el).paddingBottom));
    expect(heroPaddingTop).toBeGreaterThan(0);
    expect(heroPaddingBottom).toBeGreaterThan(0);

    // Verify .max-w-7xl.mx-auto containers have non-zero horizontal margins on desktop viewport
    const container = page.locator('.max-w-7xl.mx-auto').first();
    await expect(container).toBeVisible();

    const margins = await container.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        marginLeft: parseFloat(computed.marginLeft),
        marginRight: parseFloat(computed.marginRight),
        width: parseFloat(computed.width)
      };
    });

    // In a 1280px viewport, max-w-7xl (80rem = 1280px) or centered container has balanced non-zero margin or fits centered
    // Ensure margins are not forced to 0px by an unlayered * { margin: 0 }
    expect(margins.marginLeft).toBeGreaterThanOrEqual(0);
    expect(margins.marginRight).toBeGreaterThanOrEqual(0);

    // Let's also check at a larger viewport (1440x900) where max-w-7xl (1280px) MUST have strictly positive horizontal margins
    await page.setViewportSize({ width: 1440, height: 900 });
    const largeMargins = await container.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        marginLeft: parseFloat(computed.marginLeft),
        marginRight: parseFloat(computed.marginRight),
      };
    });
    expect(largeMargins.marginLeft).toBeGreaterThan(10);
    expect(largeMargins.marginRight).toBeGreaterThan(10);

    // Verify Projects section has non-zero padding and renders fallback projects
    const projectsSection = page.locator('#projects');
    await expect(projectsSection).toBeVisible();
    const projectPaddingTop = await projectsSection.evaluate((el) => parseFloat(window.getComputedStyle(el).paddingTop));
    expect(projectPaddingTop).toBeGreaterThan(0);

    // Verify projects are rendered
    await expect(page.getByText('Multi-Object Tracking by Yolov4+DeepSort').or(page.getByText('CenterFusionDetect3D'))).toBeVisible();

    // Verify fallback skills and experience render
    await expect(page.getByText('System Evolution')).toBeVisible();
    await expect(page.getByText('Capabilities & Stack')).toBeVisible();
  });
});
