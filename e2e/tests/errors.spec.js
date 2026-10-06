const { test, expect } = require('@playwright/test');
const { setAIMode, signUp, uniqueEmail } = require('./helpers');

test('sign-up validates before contacting Firebase', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText(/valid email address/)).toBeVisible();
  await expect(page.getByText(/at least 8 characters, including a letter and a number/)).toBeVisible();
  await expect(page.getByText(/what MindMate is for/)).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test('wrong password shows a clear message', async ({ page, browser }) => {
  const account = await signUp(page, { email: uniqueEmail('wrongpw') });
  const fresh = await browser.newPage();
  await fresh.goto('/login');
  await fresh.getByLabel('Email').fill(account.email);
  await fresh.getByLabel('Password', { exact: true }).fill('not-the-password1');
  await fresh.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(fresh.getByRole('alert')).toContainText(/don’t match an account/);
  await expect(fresh).toHaveURL(/\/login$/);
  await fresh.close();
});

test('password reset does not reveal whether an account exists', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(uniqueEmail('nobody'));
  await page.getByRole('button', { name: /send/i }).click();
  await expect(page.getByText(/if an account exists/i)).toBeVisible();
});

test('AI failure on an ordinary message can be retried', async ({ page, request }) => {
  await signUp(page, { name: 'Ari' });
  await setAIMode(request, 'fail');
  await page.goto('/chat');
  const box = page.getByRole('textbox', { name: /message/i });
  await box.fill('Can we talk about my week?');
  await box.press('Enter');
  const err = page.getByRole('alert');
  await expect(err).toBeVisible();
  await setAIMode(request, 'ok');
  await err.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText(/That sounds like a lot to carry/)).toBeVisible();
  // Exactly one copy of the message, on screen and after reloading from the server.
  await expect(page.locator('.bubble--user')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.bubble--user')).toHaveCount(1);
});

test('medication advice from the AI is replaced before the user sees it', async ({ page, request }) => {
  await signUp(page, { name: 'Kai' });
  await setAIMode(request, 'dosage');
  await page.goto('/chat');
  const box = page.getByRole('textbox', { name: /message/i });
  await box.fill('What should I take for my anxiety?');
  await box.press('Enter');
  await expect(page.getByText(/not a medical professional/)).toBeVisible();
  await expect(page.getByText(/50mg/)).toHaveCount(0);
  await setAIMode(request, 'ok');
});

test('the API being unreachable shows a friendly error', async ({ page }) => {
  await signUp(page, { name: 'Bo' });
  await page.route('**/api/dashboard*', (route) => route.abort());
  await page.goto('/home');
  await expect(page.getByText(/can’t reach MindMate right now/)).toBeVisible();
});

test('deleting the account removes it', async ({ page }) => {
  const account = await signUp(page, { name: 'Del', email: uniqueEmail('delete') });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Delete account' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Delete my account' })).toBeDisabled();
  await dialog.getByLabel('Type DELETE to confirm').fill('delete');
  await dialog.getByRole('button', { name: 'Delete my account' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
