const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const root = path.resolve(process.env.NHMC_SITE_ROOT || path.join(__dirname, ".."));
const output = process.env.AUDIT_SCREENSHOTS;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };

async function main() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const url = `http://127.0.0.1:${server.address().port}/assets/blog/nhmc/`;
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".katex-error").count(), 0);
    assert.equal(await page.locator(".katex-display").count(), 28);
    assert.equal(await page.locator('a[href="https://artowen.su.domains/mc/Ch-var-is.pdf"]').count(), 2);
    const html = fs.readFileSync(path.join(root, "assets/blog/nhmc/index.html"), "utf8");
    for (const removed of ["\\zeta", "加权之后结果无偏", "weighted result is unbiased", "V_{max}", "加密", "fall on the diagonal"]) {
      assert.ok(!html.includes(removed), `Stale claim: ${removed}`);
    }

    for (const coupling of ["0.20", "0.24", "0.27", "0.30"]) {
      await page.selectOption("#v-k", coupling);
      const curves = await page.locator('#vol-svg [data-series="volume-prediction"]').count();
      assert.equal(curves, coupling === "0.20" ? 0 : 2);
      if (coupling === "0.20") {
        assert.ok(await page.locator("#vol-svg circle, #vol-svg rect").count());
        continue;
      }
      // The plotted curve must reproduce the independent prediction records,
      // including transfer points, within its sampled SVG interpolation error.
      const residuals = await page.evaluate((k) => {
        const predictions = window.BLOG_DATA.accept.filter((r) => r.kind === "transfer" && r.kappa === k && r.pred >= 1e-4);
        const curves = [...document.querySelectorAll('#vol-svg [data-series="volume-prediction"]')];
        return predictions.map((r) => {
          const curve = curves[r.m === "rt" ? 0 : 1];
          const pts = curve
            .getAttribute("d")
            .match(/[ML][^ML]+/g)
            .map((p) => p.slice(1).split(",").map(Number));
          const x = 60 + (Math.log10(r.L ** 2 / 100) / Math.log10(200)) * 480;
          const y = 280 - ((Math.log10(r.pred) + 4) / 4) * 260;
          const i = pts.findIndex((p) => p[0] >= x);
          if (i < 1) return Infinity;
          const [a, b] = [pts[i - 1], pts[i]];
          const interpolated = a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
          return Math.abs(y - interpolated);
        });
      }, Number(coupling));
      assert.ok(residuals.length && residuals.every((x) => x < 0.25), `Prediction mismatch at ${coupling}: ${residuals}`);
    }

    for (const coupling of ["0.20", "0.24", "0.27", "0.30"]) {
      await page.selectOption("#smp-k", coupling);
      assert.equal(await page.locator("[data-nhmc-operation]").count(), coupling === "0.27" ? 4 : 1);
      assert.equal(await page.locator('[data-nhmc-operation="leapfrog"]').count(), coupling === "0.27" ? 1 : 0);
      assert.equal(await page.locator('[data-nhmc-operation="retrain"]').count(), coupling === "0.27" ? 1 : 0);
      if (coupling === "0.27") {
        await page.locator('[data-nhmc-operation="split"]').hover();
        assert.match(await page.locator("#tip").innerText(), /3\.755/);
      }
    }

    const stageTable = await page.locator("#nhmc-stage-scan td").allTextContents();
    const stageData = await page.evaluate(() => window.BLOG_DATA.nhmcStageScan.map((r) => r.variance));
    assert.deepEqual(stageTable.map(Number), stageData);
    assert.deepEqual(await page.evaluate(() => window.BLOG_DATA.nhmcStageScan.map((r) => r.T)), [4, 8, 16, 32]);

    await page.selectOption("#v-k", "0.27");
    await page.selectOption("#smp-k", "0.27");
    if (output) fs.mkdirSync(output, { recursive: true });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const lang of ["zh", "en", "both"]) {
        await page.locator(`button[data-lang="${lang}"]`).click();
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          failedImages: [...document.images].filter((im) => !im.complete || im.naturalWidth === 0).map((im) => im.src),
          badPaths: [...document.querySelectorAll(".plot path")].filter((p) => /NaN|Infinity/.test(p.getAttribute("d"))).length,
        }));
        assert.deepEqual(state, { overflow: false, failedImages: [], badPaths: 0 }, `${width}/${lang}`);
        if (output && lang !== "both" && width !== 320) {
          await page.screenshot({ path: path.join(output, `nhmc-${width}-${lang}.png`), fullPage: true });
          for (const id of ["vol-svg", "smp-svg", "nhmc-stage-scan"]) {
            await page.locator(`#${id}`).screenshot({ path: path.join(output, `${id}-${width}-${lang}.png`) });
          }
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('button[data-lang="en"]').click();
    await page.locator("#t-run").click();
    await page.waitForFunction(() => /steps [1-9]/.test(document.querySelector("#s-rt").innerText));
    await page.locator("#t-run").click();
    const pixels = await page.locator("#c-rt").evaluate((c) => {
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      return data.filter((v, i) => i % 4 === 3 && v > 0).length;
    });
    assert.ok(pixels > 0);
    await page.locator("#t-reset").click();
    assert.match(await page.locator("#s-rt").innerText(), /steps 0/);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: bilingual claims, 28 equations, prediction provenance, measured refinement points, 9 viewport/language combinations, and toy controls."
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
