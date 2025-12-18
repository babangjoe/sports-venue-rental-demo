import { test, expect } from '@playwright/test';

const url = 'http://localhost:4000/';

test.beforeEach(async ({ page }) => {
    await page.goto(url);
});

test('verify title', async ({ page }) => {
    await test.step('verify title', async () => {
        await expect(page).toHaveTitle('SportArena - Sewa Venue Olahraga Terbaik');
    });
});

test('verify link booking in homepage', async ({ page }) => {
    await test.step('verify button booking enabled', async () => {
        const btnBookNow = page.getByRole('link', { name: 'Book Now' }).first();
        await expect(btnBookNow).toBeEnabled();
    });
});

test('verify sports section', async ({ page }) => {
    await test.step('verify sports section', async () => {
        const sportsSection = page.getByRole('heading', { name: 'Sports' });
        await expect(sportsSection).toBeVisible();

        await sportsSection.scrollIntoViewIfNeeded();
    });
});
