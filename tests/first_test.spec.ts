import { test, expect } from '@playwright/test';

test('verify title', async ({ page }) => {

    await test.step('navigate to url homepage', async () => {
        await page.goto('http://localhost:3000/');
    });

    await test.step('verify title', async () => {
        await expect(page).toHaveTitle('SportArena - Sewa Venue Olahraga Terbaik');
    });
});

test('verify link booking in homepage', async ({ page }) => {
    await test.step('navigate to url homepage', async () => {
        await page.goto('http://localhost:3000/');
    });

    await test.step('verify button booking enabled', async () => {
        const button = page.getByRole('link', { name: 'Booking Sekarang' });
        await expect(button).toBeEnabled();
    });
});