import { test, expect } from '@playwright/test';
import { createAndLoginVerifiedUser, createVerifiedUserViaApi } from './helpers/auth-helper';

test.describe('Profile Page E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000);

  test('should redirect unauthenticated users accessing /profile to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('should display error message when visiting an unknown username', async ({ page }) => {
    const unknownUsername = `nonexistent_user_${Date.now()}`;
    await page.goto(`/u/${unknownUsername}`);

    await expect(page.getByRole('heading', { name: 'Profile Not Found' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Profile for user '${unknownUsername}' not found.`)).toBeVisible();
  });

  test('should display public profile controls to unauthenticated visitors without edit capabilities', async ({
    page,
  }) => {
    // 1. Create and verify target user via API & database
    const targetUser = await createVerifiedUserViaApi('pub');

    // 2. Unauthenticated browser page visits public profile /u/:username
    await page.goto(`/u/${targetUser.username}`);

    // Verify handle and public controls render
    await expect(page.getByText(`@${targetUser.username}`)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /follow/i })).toBeVisible();

    // Verify owner-only edit buttons are hidden from public visitors
    await expect(page.getByRole('button', { name: 'Edit Profile' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Banner' })).not.toBeVisible();
  });

  test('should allow authenticated owner to edit profile fields and persist changes on reload', async ({
    page,
  }) => {
    // 1. Log in as verified test user
    const owner = await createAndLoginVerifiedUser(page);

    // 2. Navigate to own profile
    await page.goto(`/u/${owner.username}`);

    // Verify owner edit controls are present
    const editProfileButton = page.getByRole('button', { name: 'Edit Profile' });
    await expect(editProfileButton).toBeVisible({ timeout: 20000 });

    // 3. Open Edit Basic Profile Modal
    await editProfileButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Profile / About' })).toBeVisible();

    // 4. Update profile fields using placeholders matching React component
    const newHeadline = 'Senior Shader Engineer & Tech Lead';
    const newBio = 'Passionate about realtime graphics, PBR pipelines, and rendering engines.';
    const newLocation = 'Montreal, Canada';
    const newAvailability = 'Open to offers';

    await page.getByPlaceholder('e.g. Lead Gameplay Programmer · Shader Developer').fill(newHeadline);
    await page.getByPlaceholder('Tell other game developers about your experience and focus...').fill(newBio);
    await page.getByPlaceholder('e.g. Kerala, India').fill(newLocation);
    await page.locator('select').selectOption(newAvailability);

    // 5. Save Profile
    await page.getByRole('button', { name: 'Save Profile' }).click();

    // Verify modal closes and updated fields are rendered on UI
    await expect(page.getByRole('heading', { name: 'Edit Profile / About' })).not.toBeVisible();
    await expect(page.getByText(newHeadline).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(newLocation).first()).toBeVisible();
    await expect(page.getByText(newAvailability).first()).toBeVisible();

    // 6. Reload page and verify changes persist from backend database
    await page.reload();
    await expect(page.getByText(newHeadline).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(newLocation).first()).toBeVisible();
    await expect(page.getByText(newAvailability).first()).toBeVisible();
  });

  test('should enforce authorization and prevent editing another user profile', async ({ page }) => {
    // 1. Create User A and log in on page
    await createAndLoginVerifiedUser(page);

    // 2. Create User B via backend API
    const userB = await createVerifiedUserViaApi('usr_b');

    // 3. User A (currently logged in) visits User B's profile /u/userB
    await page.goto(`/u/${userB.username}`);
    await expect(page.getByText(`@${userB.username}`)).toBeVisible({ timeout: 20000 });

    // User A should see Follow button, NOT Edit Profile button on User B's profile
    await expect(page.getByRole('button', { name: 'Edit Profile' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /follow/i })).toBeVisible();

    // 4. Verify backend API protection: unauthenticated PATCH /profile/me returns 401
    const unauthPatchRes = await fetch('http://localhost:3000/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: 'Hacked Headline' }),
    });
    expect(unauthPatchRes.status).toBe(401);
  });
});
