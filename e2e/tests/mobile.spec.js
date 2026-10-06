const { test, expect } = require('@playwright/test');
const { signUp } = require('./helpers');

const SHOTS = process.env.SHOTS_DIR;
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }) : null);

async function noHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('mobile: landing, sign up, bottom navigation and crisis button', async ({ page }) => {
  await page.goto('/');
  await noHorizontalScroll(page);
  await shot(page, '20-mobile-landing');

  await signUp(page, { name: 'Mo' });
  const nav = page.getByRole('navigation', { name: 'Main' }).last();
  await expect(nav).toBeVisible();
  await noHorizontalScroll(page);
  await shot(page, '21-mobile-home');

  for (const [label, url, file] of [
    ['Check-in', /\/mood$/, '22-mobile-mood'],
    ['Talk', /\/chat/, '23-mobile-chat'],
    ['Wellbeing', /\/wellbeing$/, '24-mobile-wellbeing'],
    ['Profile', /\/profile$/, '25-mobile-profile'],
  ]) {
    await nav.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(url);
    await noHorizontalScroll(page);
    await shot(page, file);
  }

  for (const path of ['/wellbeing/breathing', '/wellbeing/mindfulness', '/wellbeing/movement', '/wellbeing/sleep', '/wellbeing/connection', '/wellbeing/plans', '/resources', '/about', '/privacy']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
  }
  await page.goto('/wellbeing/breathing');
  await shot(page, '26-mobile-breathing');

  await page.getByRole('button', { name: /help/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await shot(page, '27-mobile-crisis');
});
