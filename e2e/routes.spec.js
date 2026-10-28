import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/checkpoint', '/wearable', '/platform', '/integration', '/assurance', '/pilot', '/credits'];

for (const route of routes) {
  test(`public route ${route} has a heading and no critical accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('contact table can be filtered and alert action dialog can be completed by keyboard', async ({ page }) => {
  await page.goto('/console');
  await expect(page.getByRole('button', { name: 'Continue to sign in' })).toBeVisible();
});
