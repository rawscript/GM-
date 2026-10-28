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
  await page.getByLabel('Operational role').selectOption('surveillance officer');
  await page.getByRole('button', { name: 'Continue to console' }).click();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await page.getByLabel('Search contacts').fill('GM-KEN-1072');
  await expect(page.getByRole('link', { name: 'GM-KEN-1072' })).toBeVisible();
  await page.getByRole('link', { name: 'Alerts', exact: true }).click();
  await page.getByRole('button', { name: 'Review' }).first().focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Reason for action').fill('Health worker review initiated');
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(page.getByText(/Acknowledged AL-/)).toBeVisible();
});
