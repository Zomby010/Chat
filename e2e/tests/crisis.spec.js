const { test, expect } = require('@playwright/test');
const { setAIMode, lastAIRequest, signUp } = require('./helpers');

const SHOTS = process.env.SHOTS_DIR;
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }) : null);

test('crisis help is reachable without an account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /help/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox').selectOption('KE');
  await expect(dialog.getByRole('link', { name: /call 999/i })).toHaveAttribute('href', 'tel:999');
  await expect(dialog.getByRole('link', { name: /kenya red cross/i })).toHaveAttribute('href', 'tel:1199');
  await shot(page, '10-crisis-dialog');
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.goto('/resources');
  await expect(page.getByRole('heading', { name: 'Support when you need it' })).toBeVisible();
  await shot(page, '11-resources');
});

test('imminent risk in chat gets a fixed safety reply and never reaches the AI', async ({ page, request }) => {
  await setAIMode(request, 'ok');
  await signUp(page, { name: 'Sam' });
  await page.goto('/profile');
  await page.getByLabel('Country for support lines').selectOption('GB');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  await page.goto('/chat');
  const before = JSON.stringify(await lastAIRequest(request));
  const box = page.getByRole('textbox', { name: /message/i });
  await box.fill("I'm going to kill myself tonight");
  await box.press('Enter');
  await expect(page.getByText(/you might be in danger right now/)).toBeVisible();
  await expect(page.getByText('You don’t have to face this alone')).toBeVisible();
  await expect(page.getByRole('link', { name: /samaritans/i }).first()).toHaveAttribute('href', 'tel:116123');
  expect(JSON.stringify(await lastAIRequest(request))).toBe(before);
  await shot(page, '12-chat-crisis');
});

test('high-risk message still gets crisis support when the AI is down', async ({ page, request }) => {
  await signUp(page, { name: 'Jo' });
  await setAIMode(request, 'fail');
  await page.goto('/chat');
  const box = page.getByRole('textbox', { name: /message/i });
  await box.fill('I want to die');
  await box.press('Enter');
  await expect(page.getByText('You don’t have to face this alone')).toBeVisible();
  await setAIMode(request, 'ok');
});

test('a mood note with risk language shows support lines', async ({ page }) => {
  await signUp(page, { name: 'Lee' });
  await page.goto('/mood');
  await page.getByRole('radio', { name: /struggling/i }).first().click();
  await page.getByRole('textbox').first().fill('I feel hopeless and want to disappear');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText('Support is available right now')).toBeVisible();
});
