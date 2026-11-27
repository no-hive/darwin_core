import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './browser',
  testMatch: 'editorial.spec.mjs',
  snapshotPathTemplate: '{testDir}/../baseline/visual/{projectName}/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: {timeout: 10000, toHaveScreenshot: {animations: 'disabled', caret: 'hide', threshold: 0, maxDiffPixels: 0}},
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    locale: 'en-US', timezoneId: 'Europe/Belgrade', colorScheme: 'dark',
    reducedMotion: 'no-preference', serviceWorkers: 'block', deviceScaleFactor: 1,
    viewport: {width: 1440, height: 1000}, launchOptions: {args: ['--no-sandbox']}
  },
  projects: [{name: 'desktop'}],
  webServer: {command: 'QA_PORT=4174 node serve.mjs', url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI}
});
