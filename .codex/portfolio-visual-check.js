const playwrightPath = process.argv[2];

if (!playwrightPath) {
  throw new Error("Pass the absolute Playwright package path as the first argument.");
}

const { chromium } = require(playwrightPath);

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectCanvasPixels(page) {
  await page.waitForSelector("#hero-canvas");
  await page.waitForTimeout(1800);

  const stats = await page.$eval("#hero-canvas", (canvas) => {
    const hasContext = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    if (!hasContext) return { hasContext: false, nonEmptySamples: 0, width: canvas.width, height: canvas.height };

    const width = canvas.width;
    const height = canvas.height;
    const sampler = document.createElement("canvas");
    sampler.width = width;
    sampler.height = height;
    const context = sampler.getContext("2d");
    context.drawImage(canvas, 0, 0);
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

    for (const [xRatio, yRatio] of points) {
      const pixel = context.getImageData(
        Math.max(0, Math.floor(width * xRatio)),
        Math.max(0, Math.floor(height * yRatio)),
        1,
        1
      ).data;

      if (pixel[0] + pixel[1] + pixel[2] + pixel[3] > 0) nonEmptySamples += 1;
    }

    return { hasContext: true, nonEmptySamples, width, height };
  });

  await assert(stats.hasContext, "Hero canvas did not expose a WebGL context.");
  await assert(stats.width > 100 && stats.height > 100, `Canvas dimensions were too small: ${stats.width}x${stats.height}.`);
  await assert(stats.nonEmptySamples > 0, `Hero canvas appeared blank in sampled pixels: ${JSON.stringify(stats)}.`);
  return stats;
}

async function checkViewport(browser, viewport, screenshotPath) {
  const page = await browser.newPage({ viewport });
  const consoleMessages = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || "failed"}`));
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const libraryState = await page.evaluate(() => ({
    hasThree: Boolean(window.THREE),
    hasGsap: Boolean(window.gsap),
    heroSceneStatus: window.__heroSceneStatus || "missing",
    canvasSize: {
      width: document.querySelector("#hero-canvas")?.width,
      height: document.querySelector("#hero-canvas")?.height
    }
  }));
  await assert(libraryState.hasThree, `Three.js was not available. Console: ${consoleMessages.join(" | ")} Failed: ${failedRequests.join(" | ")}`);
  await assert(libraryState.hasGsap, `GSAP was not available. Console: ${consoleMessages.join(" | ")} Failed: ${failedRequests.join(" | ")}`);
  await assert(await page.getByRole("heading", { name: /Sohan Jambhule builds/i }).isVisible(), "Hero heading is not visible.");
  await assert(await page.locator(".hero-content").isVisible(), "Hero content is not visible.");

  const heroBox = await page.locator(".hero-content").boundingBox();
  const canvasBox = await page.locator("#hero-canvas").boundingBox();
  await assert(Boolean(heroBox && canvasBox), "Hero or canvas box could not be measured.");

  const overlapX = Math.max(0, Math.min(heroBox.x + heroBox.width, canvasBox.x + canvasBox.width) - Math.max(heroBox.x, canvasBox.x));
  const overlapY = Math.max(0, Math.min(heroBox.y + heroBox.height, canvasBox.y + canvasBox.height) - Math.max(heroBox.y, canvasBox.y));
  const overlapArea = overlapX * overlapY;
  const heroArea = heroBox.width * heroBox.height;
  await assert(overlapArea / heroArea < 0.08, "Hero canvas overlaps too much important hero text.");

  await page.screenshot({ path: screenshotPath, fullPage: true });
  const canvasStats = await expectCanvasPixels(page);
  canvasStats.libraryState = libraryState;
  await page.close();
  return canvasStats;
}

(async () => {
  const browser = await chromium.launch({ args: ["--enable-webgl", "--use-gl=swiftshader"] });
  const desktop = await checkViewport(browser, { width: 1440, height: 1000 }, "portfolio-desktop-check.png");
  const mobile = await checkViewport(browser, { width: 390, height: 844 }, "portfolio-mobile-check.png");
  await browser.close();

  console.log(JSON.stringify({ desktop, mobile }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
