import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
try {
  const page = await browser.newPage({viewport:{width:1400, height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(process.env.DEMO_URL || pathToFileURL(resolve('dist/index.html')).href);
  await page.waitForFunction(() => window.dinosaurDemo?.ready, null, {timeout:120000});
  for (const id of ['trex','stego','trice','ptero','mosa','deino','bear','boar','fox','hyena','lion','wolf']) {
    await page.selectOption('#model-select', id, {force:true});
    await page.waitForFunction(id => window.dinosaurDemo.modelId === id, id, {timeout:60000});
    const result = await page.evaluate(() => {
      const runtime = dinosaurDemo.model.userData.sculptRuntime;
      return {runtime:!!runtime, labels:[...document.querySelectorAll('[data-action]')].map(b => b.textContent.trim())};
    });
    assert.ok(result.runtime, `${id}: missing sculptRuntime`);
    assert.ok(result.labels.length && result.labels.every(Boolean), `${id}: missing action labels`);
    console.log(id, result.labels.length, 'actions');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: all 12 models load; action labels and runtime present; no page errors.');
} finally {await browser.close();}
