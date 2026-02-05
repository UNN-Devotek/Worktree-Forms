const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connect({ wsEndpoint: 'ws://localhost:9222' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3005/project/test-project-rVrGS/sheets/cml9s2c0i0009k9jnr93uz3sg');
  await page.waitForTimeout(2000);
  
  // Click on cell A1 (approximate coordinates based on screenshot)
  await page.mouse.click(200, 270);
  await page.waitForTimeout(500);
  
  // Type "Hello"
  await page.keyboard.type('Hello');
  await page.waitForTimeout(500);
  
  // Press Enter to commit
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await page.screenshot({ path: 'after-typing.png' });
  
  console.log('Done!');
  await browser.close();
})();
