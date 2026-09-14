// Inspection-only thumbnail/crop from an existing source image. Never overwrites source bytes.
const fs = require('fs');
const path = require('path');
const { ROOT, CACHE, inside } = require('./common');
const { discoverBrowser, getChromium } = require('../qa/browser');
async function main() {
  const [input, label, ...crop] = process.argv.slice(2);
  if (!input || !/^[a-z0-9-]+$/.test(label || '')) throw new Error('Usage: image-preview.js <theme-relative-image> <label> [x y width height]');
  const source = inside(ROOT, input), output = inside(path.join(CACHE, 'previews'), `${label}.png`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const found = discoverBrowser();
  if (!found.browser) throw new Error('Browser unavailable');
  const browser = await getChromium().launch({ executablePath: found.browser.executablePath, headless: true });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async ({ data, crop }) => {
      const image = new Image(); image.src = data; await image.decode();
      const rect = crop.length ? crop.map(Number) : [0, 0, image.width, image.height];
      if (rect.length !== 4 || !rect.every(Number.isFinite) || rect[0] < 0 || rect[1] < 0 || rect[2] <= 0 || rect[3] <= 0 || rect[0]+rect[2] > image.width || rect[1]+rect[3] > image.height) throw new Error('Invalid source crop');
      const scale = crop.length ? 1 : Math.min(1, 1400 / rect[3], 1400 / rect[2]);
      const canvas = document.createElement('canvas'); canvas.width = Math.round(rect[2]*scale); canvas.height = Math.round(rect[3]*scale);
      canvas.getContext('2d').drawImage(image, ...rect, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }, { data: `data:image/png;base64,${fs.readFileSync(source).toString('base64')}`, crop });
    fs.writeFileSync(output, Buffer.from(result.split(',')[1], 'base64'));
    console.log(path.relative(ROOT, output));
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
