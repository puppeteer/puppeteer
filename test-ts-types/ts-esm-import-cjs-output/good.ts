// eslint-disable-next-line import/extensions
import * as puppeteer from 'puppeteer';
import type { ElementHandle } from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch();
  const devices = puppeteer.devices;
  console.log(devices);
  const page = await browser.newPage();
  const div = (await page.$('div')) as ElementHandle<HTMLAnchorElement>;
  console.log('got a div!', div);
}
run();
