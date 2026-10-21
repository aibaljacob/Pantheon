import { test, expect } from '@playwright/test';

test.describe('Login Page Smoke Tests', () => {
  test('should render the login page with accessible controls and branding', async ({ page }) => {
    await page.goto('/login');

    // 1. Verify page title and header
    await expect(page).toHaveTitle(/Pantheon/i);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(
      page.getByText('Continue building incredible games with your team.'),
    ).toBeVisible();

    // 2. Verify accessible form elements
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('placeholder', 'name@studio.com');

    const passwordInput = page.getByLabel('Password', { exact: true });
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember Me' });
    await expect(rememberMeCheckbox).toBeVisible();
    await expect(rememberMeCheckbox).not.toBeChecked();

    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();

    const createAccountLink = page.getByRole('link', { name: 'Create one' });
    await expect(createAccountLink).toBeVisible();
  });

  test('should display client-side validation errors when submitting empty form', async ({
    page,
  }) => {
    await page.goto('/login');

    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await signInButton.click();

    // Verify accessible error messages rendered by zodResolver
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('should allow entering credentials and toggling remember me', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel('Email');
    await emailInput.fill('developer@pantheon.studio');
    await expect(emailInput).toHaveValue('developer@pantheon.studio');

    const passwordInput = page.getByLabel('Password', { exact: true });
    await passwordInput.fill('SecurePassword123!');
    await expect(passwordInput).toHaveValue('SecurePassword123!');

    const rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember Me' });
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();
  });

  test('should navigate from login to register page', async ({ page }) => {
    await page.goto('/login');

    const createAccountLink = page.getByRole('link', { name: 'Create one' });
    await createAccountLink.click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
  });
});
