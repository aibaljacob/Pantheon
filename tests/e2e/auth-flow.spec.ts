import { test, expect } from '@playwright/test';

test.describe('Authentication Security & Protected Routes E2E Tests', () => {
  test('should display API error when logging in with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent_user@pantheon-test.com');
    await page.getByLabel('Password', { exact: true }).fill('IncorrectPassword123!');

    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await signInButton.click();

    // Verify backend error response displayed in error container
    const errorBanner = page.locator('.text-red-400');
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
    await expect(errorBanner).toHaveText(/401|invalid|failed/i);
  });

  test('should display API error when attempting to log in with an unverified account', async ({
    page,
  }) => {
    // 1. Register a new unverified user via /register with guaranteed unique credentials
    const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const unverifiedUsername = `unv_${uid}`;
    const unverifiedEmail = `unv_${uid}@pantheon-test.com`;
    const password = 'PantheonUnverified#2026!';

    await page.goto('/register');
    await page.getByLabel('Full Name').fill('Unverified Tester');

    const checkUsernamePromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/check-username'),
    );
    await page.getByLabel('Username').fill(unverifiedUsername);
    await checkUsernamePromise;

    const checkEmailPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/check-email'),
    );
    await page.getByLabel('Email').fill(unverifiedEmail);
    await checkEmailPromise;

    const passwordInput = page.getByLabel('Password', { exact: true });
    await passwordInput.fill(password);

    const confirmPasswordInput = page.getByLabel('Confirm Password');
    await confirmPasswordInput.fill(password);

    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await submitButton.click();

    await expect(page).toHaveURL(/\/verification-sent$/, { timeout: 15000 });

    // 2. Attempt to log in with the newly registered (unverified) account
    await page.goto('/login');
    await page.getByLabel('Email').fill(unverifiedEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify NestJS backend blocks unverified user with 403 Forbidden message
    const errorBanner = page.locator('.text-red-400');
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
    await expect(errorBanner).toHaveText(/403|verified|forbidden|failed/i);
  });

  test('should redirect unauthenticated users away from protected routes to login', async ({
    page,
  }) => {
    const protectedRoutes = ['/dashboard', '/projects', '/profile', '/settings'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    }
  });
});
