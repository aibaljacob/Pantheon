import { test, expect } from '@playwright/test';

test.describe('Registration Page E2E Tests', () => {
  test('should render the registration page with accessible controls', async ({ page }) => {
    await page.goto('/register');

    // 1. Verify header branding and subtitle
    await expect(page).toHaveTitle(/Pantheon/i);
    await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
    await expect(
      page.getByText('Join the next generation of game creators.'),
    ).toBeVisible();

    // 2. Verify all form controls exist with expected labels and attributes
    const fullNameInput = page.getByLabel('Full Name');
    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toHaveAttribute('placeholder', 'Elena Rostova');

    const usernameInput = page.getByLabel('Username');
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('placeholder', 'elena.rostova');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('placeholder', 'elena@studio.com');

    const passwordInput = page.getByLabel('Password', { exact: true });
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const confirmPasswordInput = page.getByLabel('Confirm Password');
    await expect(confirmPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Note: terms checkbox defaults to checked (terms: true) in RegisterForm defaultValues
    const termsCheckbox = page.getByRole('checkbox');
    await expect(termsCheckbox).toBeVisible();
    await expect(termsCheckbox).toBeChecked();

    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    const signInLink = page.getByRole('link', { name: 'Sign In' });
    await expect(signInLink).toBeVisible();
  });

  test('should display client-side validation errors when submitting invalid or incomplete form', async ({
    page,
  }) => {
    await page.goto('/register');

    // Uncheck terms to trigger terms validation message
    const termsCheckbox = page.getByRole('checkbox');
    await termsCheckbox.uncheck();

    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await submitButton.click();

    // Verify client-side Zod validation messages
    await expect(page.getByText('Full name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    await expect(page.getByText('Please confirm your password')).toBeVisible();
    await expect(
      page.getByText('You must agree to the Terms of Service & Privacy Policy'),
    ).toBeVisible();
  });

  test('should handle invalid email, password complexity and mismatch rules', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.getByLabel('Email');
    await emailInput.fill('not-an-email');
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();

    const passwordInput = page.getByLabel('Password', { exact: true });
    // Fill 8+ characters without uppercase/number/special to trigger complexity regex
    await passwordInput.fill('simplepassword');
    await expect(
      page.getByText('Must include uppercase, lowercase, number & special character'),
    ).toBeVisible();

    const confirmPasswordInput = page.getByLabel('Confirm Password');
    await passwordInput.fill('ComplexPass123!');
    await confirmPasswordInput.fill('DifferentPass123!');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should navigate to login page when clicking Sign In link', async ({ page }) => {
    await page.goto('/register');

    const signInLink = page.getByRole('link', { name: 'Sign In' });
    await signInLink.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('should successfully register a new account and redirect to verification-sent', async ({
    page,
  }) => {
    await page.goto('/register');

    const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const uniqueUsername = `reg_${uid}`;
    const uniqueEmail = `reg_${uid}@pantheon-test.com`;

    await page.getByLabel('Full Name').fill('Playwright Test User');

    const checkUsernamePromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/check-username'),
    );
    await page.getByLabel('Username').fill(uniqueUsername);
    await checkUsernamePromise;

    const checkEmailPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/check-email'),
    );
    await page.getByLabel('Email').fill(uniqueEmail);
    await checkEmailPromise;

    const passwordInput = page.getByLabel('Password', { exact: true });
    await passwordInput.fill('PantheonE2E#2026!');

    const confirmPasswordInput = page.getByLabel('Confirm Password');
    await confirmPasswordInput.fill('PantheonE2E#2026!');

    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await submitButton.click();

    // Verify API registration succeeds and redirects to /verification-sent
    await expect(page).toHaveURL(/\/verification-sent$/, { timeout: 45000 });
    await expect(page.getByRole('heading', { name: 'Check Your Inbox' })).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });
});
