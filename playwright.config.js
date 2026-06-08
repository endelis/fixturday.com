import dotenv from 'dotenv';
import { defineConfig } from '@playwright/test';

dotenv.config();

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'https://www.fixturday.com',
    ignoreHTTPSErrors: true,
    screenshot: 'on',
    video: 'on-first-retry',
  },
});
