import { test, expect } from '@playwright/test';

test.describe('AudioMaster App', () => {
  test('has title and header', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/My Google AI Studio App/);
    await expect(page.locator('h1')).toContainText('MasterForge');
  });

  test('can open and interact with the upload zone', async ({ page }) => {
    await page.goto('/');
    const dropzone = page.locator('.border-dashed').first();
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('Upload Audio');
    await expect(dropzone).toContainText('Drag and drop');
  });

  test('can see DSP Signal Chain section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=DSP Signal Chain')).toBeVisible();
    await expect(page.locator('text=High-Resolution Analysis')).toBeVisible();
  });
  
  test('has settings panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Target LUFS')).toBeVisible();
    await expect(page.locator('span.text-gray-400', { hasText: 'True Peak Limit' })).toBeVisible();
  });

  test('can upload a file', async ({ page }) => {
    await page.goto('/');
    
    // Create a dummy file for the test
    const dummyContent = 'dummy audio data';
    const buffer = Buffer.from(dummyContent);
    
    // Wait for the input to be present in the DOM (it is hidden)
    const fileInput = page.locator('input[type="file"]').first();
    
    // Set the file on the input
    await fileInput.setInputFiles({
      name: 'test.wav',
      mimeType: 'audio/wav',
      buffer: buffer
    });

    // We should see a loading state or the file listed
    await expect(page.locator('text=test.wav')).toBeVisible({ timeout: 10000 });
  });
});
