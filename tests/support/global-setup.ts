import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global setup: authenticate as admin and member, save storageState.
 * Runs once before all tests. Uses dev login buttons (ENABLE_DEV_LOGIN=true).
 *
 * Output:
 *   playwright/.auth/admin.json
 *   playwright/.auth/member.json
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.join(process.cwd(), 'playwright', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();

  try {
    // --- Login as Admin ---
    const adminPage = await browser.newPage();
    await adminPage.goto('http://localhost:3005/login');
    await adminPage.getByRole('button', { name: 'Dev Admin' }).click();
    await adminPage.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await adminPage.context().storageState({
      path: path.join(authDir, 'admin.json'),
    });
    await adminPage.close();

    // --- Login as Member ---
    const memberPage = await browser.newPage();
    await memberPage.goto('http://localhost:3005/login');
    await memberPage.getByRole('button', { name: 'Dev User' }).click();
    await memberPage.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await memberPage.context().storageState({
      path: path.join(authDir, 'member.json'),
    });
    await memberPage.close();
  } finally {
    await browser.close();
  }
}

export default globalSetup;
