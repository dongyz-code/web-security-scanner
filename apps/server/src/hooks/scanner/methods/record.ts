import { BrowserActionRecord } from '@/types/index.js';
import { Page } from 'puppeteer';

function getDom(page: Page, selectors: string[][]) {
  const selFlat = selectors.flat();
  let xPath = selFlat.find((selector) => selector.startsWith('xpath/'));

  if (xPath) {
    xPath = xPath.replace('xpath/', '');
    return page.$(`::-p-xpath(${xPath})`);
  } else {
    return page.$(selectors[0][0]);
  }
}

export async function handleRecord(page: Page, recordJson: BrowserActionRecord) {
  const { steps } = recordJson;

  for (const step of steps) {
    if (step.type === 'setViewport') {
      // do nothing
    } else if (step.type === 'navigate') {
      await page.goto(step.url, { waitUntil: 'networkidle2' });
    } else if (step.type === 'change') {
      await page.type(step.selectors[0][0], step.value);
    } else if (step.type === 'click') {
      const btn = await getDom(page, step.selectors);
      await btn?.click({
        count: 1,
      });
      await page.waitForNetworkIdle();
    } else if (step.type === 'doubleClick') {
      const btn = await page.$(step.selectors[0][0]);
      await btn?.click({
        count: 2,
      });
      await page.waitForNetworkIdle();
    } else if (step.type === 'keyUp') {
      // await page.keyboard.up(step.key as KeyInput);
    } else if (step.type === 'keyDown') {
      // await page.keyboard.press(step.key as KeyInput);
    }
  }
}
