const { test, expect } = require('@playwright/test');
const { setAIMode, lastAIRequest, signUp, signIn } = require('./helpers');

const SHOTS = process.env.SHOTS_DIR;
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }) : null);

test('new user: sign up, check in, talk, use tools, export, sign out and back in', async ({ page, request }) => {
  await setAIMode(request, 'ok');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('calm place');
  await shot(page, '01-landing');

  const account = await signUp(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Amina');
  await shot(page, '02-home-new');

  // Mood check-in from the dashboard
  await page.getByRole('radio', { name: /good/i }).first().click();
  await page.getByRole('button', { name: /grateful/i }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText('Check-in saved')).toBeVisible();
  await shot(page, '03-home-checked-in');

  // Mood page shows the history
  await page.goto('/mood');
  await expect(page.getByText(/grateful/i).first()).toBeVisible();
  await shot(page, '04-mood');

  // Chat round trip through the backend to the (stub) AI provider
  await page.goto('/chat');
  const box = page.getByRole('textbox', { name: /message/i });
  await box.fill('Exams are stressing me out this week');
  await box.press('Enter');
  await expect(page.getByText(/That sounds like a lot to carry/)).toBeVisible();
  await expect(page).toHaveURL(/\/chat\/[\w-]+$/);
  const sent = await lastAIRequest(request);
  expect(sent.systemInstruction.parts[0].text).toMatch(/not a (licensed|qualified)|never diagnose|not a therapist/i);
  expect(JSON.stringify(sent)).not.toContain(account.email);
  await shot(page, '05-chat');

  // Behavioural activation plan
  await page.goto('/wellbeing/plans');
  await page.getByLabel('What will you do?').fill('Walk to the park');
  await page.getByRole('radiogroup', { name: 'Mood before the activity' }).getByRole('radio', { name: 'Low' }).click();
  await page.getByRole('button', { name: 'Add plan' }).click();
  await expect(page.getByText('Walk to the park')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('radiogroup', { name: 'Mood after the activity' }).getByRole('radio', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Mood 2 → 4')).toBeVisible();
  await shot(page, '06-plans');

  // Movement log
  await page.goto('/wellbeing/movement');
  await shot(page, '07-movement');

  // Export downloads a JSON file with what we created
  await page.goto('/profile');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my data' }).click()]);
  const data = JSON.parse(await (await download.createReadStream()).toArray().then((b) => Buffer.concat(b).toString()));
  expect(data.moods).toHaveLength(1);
  expect(data.plans[0].moodAfter).toBe(4);
  expect(data.chats[0].messages).toHaveLength(2);
  await shot(page, '08-profile');

  // Sign out, then return: data persisted in Firestore
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await expect(page).toHaveURL(/\/(login)?$/);
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, account);
  await expect(page.getByRole('heading', { name: 'Your latest check-in' })).toBeVisible();
  await page.goto('/chat');
  await expect(page.getByText('Exams are stressing me out').first()).toBeVisible();
});
