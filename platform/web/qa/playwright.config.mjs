import { defineConfig } from '@playwright/test';
import { viewports } from './routes.mjs';

if (process.env.SITES_MANAGED_LINUX_CONTAINER === '1' && !process.argv.includes('--list')) {
  throw Error('Browser QA is pending: use supported Sites preview/CUA here. Run this suite in a portable environment with Chromium installed.');
}
export default defineConfig({
  testDir: './browser',
  outputDir: './results/browser',
  snapshotPathTemplate: `${process.env.QA_SNAPSHOT_ROOT || '{testDir}/../baseline/screenshots'}/{projectName}/{testFilePath}/{arg}{ext}`,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  updateSnapshots: 'none',
  forbidOnly: true,
  reporter: [['list'], ['html', { outputFolder: 'qa/results/browser-report', open: 'never' }], ['json', { outputFile: 'qa/results/browser.json' }]],
  expect: { timeout: 10000, toHaveScreenshot: { animations: 'disabled', caret: 'hide', threshold: 0, maxDiffPixels: 0 } },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    locale: 'en-US', timezoneId: 'Europe/Belgrade',
    colorScheme: 'dark', reducedMotion: 'no-preference',
    serviceWorkers: 'block', deviceScaleFactor: 1,
    trace: 'retain-on-failure', screenshot: 'only-on-failure'
  },
  projects: viewports.map(viewport => ({
    name: viewport.name,
    use: { viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch, isMobile: viewport.touch }
  })),
  webServer: { command: 'node qa/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false }
});
