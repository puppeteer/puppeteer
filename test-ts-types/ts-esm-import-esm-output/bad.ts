// eslint-disable-next-line import/extensions
import * as puppeteer from 'puppeteer';

async function run() {
  // Typo in "launch"
  const browser = await puppeteer.launh();
  // Typo: "devices"
  const devices = puppeteer.devics;
  console.log(devices);
  const browser2 = await puppeteer.launch();
  // 'foo' is invalid argument
  const page = await browser2.newPage('foo');
  const div = (await page.$(
    'div'
  )) as puppeteer.ElementHandle<HTMLAnchorElement>;
  console.log('got a div!', div);
  const contentsOfDiv = await div.evaluate(
    // Bad: the type system will know here that divElem is an HTMLAnchorElement
    // and won't let me tell it it's a number
    (divElem: number) => divElem.innerText
  );
  // Bad: the type system will know here that divElem is an HTMLAnchorElement
  // and won't let me tell it it's a number via the generic
  const contentsOfDiv2 = await div.evaluate<(x: number) => string>(
    // Bad: now I've forced it to be a number (which is an error also)
    // I can't call `innerText` on it.
    (divElem: number) => divElem.innerText
  );
}
run();
