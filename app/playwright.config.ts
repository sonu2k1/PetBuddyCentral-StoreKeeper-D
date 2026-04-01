import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'off',
    },
    projects: [
        {
            name: 'Google Chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        },
    ],
    webServer: {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 120 * 1000,
    }
});
