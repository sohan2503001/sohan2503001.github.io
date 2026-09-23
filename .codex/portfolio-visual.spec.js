const { test, expect } = require("playwright/test");

async function expectHeroCanvasHasPixels(page) {
  await page.waitForSelector("#hero-canvas");
  await page.waitForTimeout(1800);

  const stats = await page.$eval("#hero-canvas", (canvas) => {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { hasContext: false, nonEmptySamples: 0, width: canvas.width, height: canvas.height };

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const points = [
      [0.5, 0.5],
      [0.4, 0.5],
      [0.6, 0.5],
      [0.5, 0.4],
      [0.5, 0.6],
      [0.35, 0.35],
      [0.65, 0.65]
    ];

    let nonEmptySamples = 0;
    const pixel = new Uint8Array(4);

    for (const [xRatio, yRatio] of points) {
      gl.readPixels(
        Math.max(0, Math.floor(width * xRatio)),
        Math.max(0, Math.floor(height * yRatio)),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel
      );

      if (pixel[0] + pixel[1] + pixel[2] + pixel[3] > 0) nonEmptySamples += 1;
    }

    return { hasContext: true, nonEmptySamples, width, height };
  });

  expect(stats.hasContext).toBe(true);
  expect(stats.width).toBeGreaterThan(100);
  expect(stats.height).toBeGreaterThan(100);
  expect(stats.nonEmptySamples).toBeGreaterThan(0);
}

test("desktop portfolio render", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Sohan Jambhule builds/i })).toBeVisible();
  await expect(page.locator(".hero-content")).toBeVisible();
  await expectHeroCanvasHasPixels(page);
  await page.screenshot({ path: ".codex/portfolio-desktop.png", fullPage: true });
});

test("mobile portfolio render", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Sohan Jambhule builds/i })).toBeVisible();
  await expect(page.locator("#hero-canvas")).toBeVisible();
  await expectHeroCanvasHasPixels(page);
  await page.screenshot({ path: ".codex/portfolio-mobile.png", fullPage: true });
});
