const { expect } = require('@playwright/test');

const STUB = 'http://127.0.0.1:9911';

async function setAIMode(request, mode) {
  await request.post(`${STUB}/__mode`, { data: { mode } });
}

async function lastAIRequest(request) {
  return (await request.get(`${STUB}/__last`)).json();
}

const uniqueEmail = (tag) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;

/** Creates an account through the real sign-up form. */
async function signUp(page, { name = 'Amina', email = uniqueEmail('user'), password = 'calm2day!' } = {}) {
  await page.goto('/signup');
  await page.getByLabel('What should we call you?').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home(\?welcome=1)?$/);
  return { name, email, password };
}

async function signIn(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}

module.exports = { setAIMode, lastAIRequest, uniqueEmail, signUp, signIn };
