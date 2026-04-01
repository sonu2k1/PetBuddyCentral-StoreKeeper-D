import { test, expect } from '@playwright/test';

// Test credentials
const ROLES = [
    {
        name: 'Super Admin',
        email: 'admin@petbuddycentral.com',
        password: 'admin123',
        expectedUrl: '/super-admin/dashboard',
        sidebarText: 'SUPER ADMIN'
    },
    {
        name: 'Franchise Owner',
        email: 'owner@petbuddycentral.com',
        password: 'owner123',
        expectedUrl: '/franchise/dashboard',
        sidebarText: 'FRANCHISE OWNER'
    },
    {
        name: 'Store Manager',
        email: 'manager@petbuddycentral.com',
        password: 'manager123',
        expectedUrl: '/store/dashboard',
        sidebarText: 'STORE MANAGER'
    }
];

test.describe('User Role Verification', () => {
    for (const role of ROLES) {
        test(`Login and Dashboard access for ${role.name}`, async ({ page }) => {
            // 1. Go to home page, which should redirect to login if not authenticated
            await page.goto('/');
            await expect(page).toHaveURL(/.*\/login/);

            // 2. Fill login form
            await page.fill('input[type="email"]', role.email);
            await page.fill('input[type="password"]', role.password);

            // 3. Submit
            await page.click('button[type="submit"]');

            // 4. Verify successful redirect to the correct dashboard
            await page.waitForURL(new RegExp(role.expectedUrl));
            expect(page.url()).toContain(role.expectedUrl);

            // 5. Verify the sidebar contains the correct role indicator text
            await expect(page.locator('.sidebar-logo-sub').first()).toHaveText(new RegExp(role.sidebarText, 'i'));

        });
    }
});
