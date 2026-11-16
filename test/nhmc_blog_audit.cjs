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
    for (const blog of ["nhmc", "sps"]) {
      await page.goto(url.replace("/nhmc/", `/${blog}/`), { waitUntil: "networkidle" });
      assert.equal(await page.locator("body").getAttribute("class"), "lang-en");
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.equal(await page.locator(".switch button").first().getAttribute("data-lang"), "en");
      await page.evaluate(() => localStorage.setItem("site-lang", "zh"));
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator("body").getAttribute("class"), "lang-en");
      await page.locator('button[data-lang="zh"]').click();
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator("body").getAttribute("class"), "lang-zh");
      await page.locator('button[data-lang="en"]').click();
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator("body").getAttribute("class"), "lang-en");
    }
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".katex-error").count(), 0);
    const equationCount = await page.locator("p.eq").count();
    assert.equal(await page.locator(".katex-display").count(), equationCount);
    assert.equal(await page.locator("#nhmc .katex-display").count(), 8);
    for (const id of ["eq-leapfrog", "eq-leapfrog-reverse"]) {
      const english = await page.locator(`#${id}-en annotation`).textContent();
      const chinese = await page.locator(`#${id}-zh annotation`).textContent();
      assert.equal(english, chinese, `Bilingual equation mismatch: ${id}`);
    }
    const leapfrog = await page.locator("#eq-leapfrog-en annotation").textContent();
    assert.equal(leapfrog.match(/\\frac\{h_t\}\{2\}/g).length, 2);
    assert.ok(leapfrog.includes("x^{(j+1)}&=x^{(j)}+h_t\\,p^{(j+\\frac12)}"));
    assert.ok(leapfrog.includes("\\mathcal F_{\\theta,t}\\!\\left(x^{(j+1)}\\right)"));
    assert.equal(
      (await page.locator("#eq-leapfrog-reverse-en annotation").textContent()).trim(),
      "\\Phi_{\\theta,t}(x_{t+1},-\\bar p_{t+1})=(x_t,-p_t)."
    );
    assert.equal(await page.locator('a[href="https://artowen.su.domains/mc/Ch-var-is.pdf"]').count(), 2);
    for (const lang of ["en", "zh"]) {
      for (const doi of ["10.1214/aos/1033066201", "10.1007/BF00162521", "10.1103/PhysRevLett.62.361"]) {
        assert.equal(await page.locator(`#problems .${lang} a[href="https://doi.org/${doi}"]`).count(), 1);
      }
      assert.equal(await page.locator(`#mcmc-${lang}`).count(), 1);
    }
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

    const stageTable = await page.locator("#nhmc-stage-scan tbody tr").first().locator("td").allTextContents();
    const stageData = await page.evaluate(() => window.BLOG_DATA.nhmcStageScan.map((r) => r.variance));
    assert.deepEqual(
      stageTable.map((value) => Number.parseFloat(value)),
      stageData
    );
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
        const clippedEquations = await page.locator("#nhmc .eq:visible").evaluateAll((blocks) =>
          blocks
            .filter((block) => {
              const outer = block.getBoundingClientRect();
              const formula = block.querySelector(".katex-html").getBoundingClientRect();
              return formula.left < outer.left - 1 || formula.right > outer.right + 1;
            })
            .map((block) => block.id || block.textContent)
        );
        assert.deepEqual(clippedEquations, [], `Clipped NHMC formula at ${width}/${lang}`);
        if (output && lang !== "both" && width !== 320) {
          await page.screenshot({ path: path.join(output, `nhmc-${width}-${lang}.png`), fullPage: true });
          for (const id of ["vol-svg", "smp-svg", "nhmc-stage-scan", "nhmc", `eq-leapfrog-${lang}`, `eq-leapfrog-reverse-${lang}`]) {
            await page.locator(`#${id}`).screenshot({ path: path.join(output, `${id}-section-${width}-${lang}.png`) });
          }
          await page
            .locator(`#eq-leapfrog-${lang}`)
            .evaluate((equation) => window.scrollTo(0, window.scrollY + equation.getBoundingClientRect().top - 280));
          await page.screenshot({ path: path.join(output, `leapfrog-viewport-${width}-${lang}.png`) });
          await page.locator(`#mcmc-${lang}`).evaluate((heading) => window.scrollTo(0, window.scrollY + heading.getBoundingClientRect().top - 80));
          await page.screenshot({ path: path.join(output, `mcmc-viewport-${width}-${lang}.png`) });
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
      `PASS: bilingual claims, ${equationCount} equations, leapfrog updates, prediction provenance, measured refinement points, 9 viewport/language combinations, and toy controls.`
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
