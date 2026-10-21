import { Page, expect } from '@playwright/test';
import { verifyUserEmail } from './test-db';

export interface TestUserCredentials {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export async function createVerifiedUserViaApi(prefix = 'usr'): Promise<TestUserCredentials> {
  const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const credentials: TestUserCredentials = {
    fullName: 'E2E Test User',
    username: `${prefix}_${uid}`.toLowerCase(),
    email: `${prefix}_${uid}@pantheon-test.com`.toLowerCase(),
    password: 'PantheonProfile#2026!',
  };

  const response = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'E2E',
      lastName: 'User',
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
      confirmPassword: credentials.password,
      acceptTerms: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to register test user via API: ${response.status} ${errText}`);
  }

  await verifyUserEmail(credentials.email);

  return credentials;
}

export async function createAndLoginVerifiedUser(page: Page): Promise<TestUserCredentials> {
  const credentials = await createVerifiedUserViaApi('prof');

  // Log in via the real UI login page
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assert login success and redirection to dashboard
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20000 });

  return credentials;
}
