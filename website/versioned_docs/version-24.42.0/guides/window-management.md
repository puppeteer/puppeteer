# Window management

Use Puppeteer's [`Browser.getWindowBounds`](https://pptr.dev/api/puppeteer.browser.getwindowbounds) and[`Browser.setWindowBounds`](https://pptr.dev/api/puppeteer.browser.setwindowbounds) methods to manage browser window position and state.

The following script opens a window at the default position on a primary 800x600 screen, then moves that window to a newly created screen and maximizes it there. After that it restores the window to its normal state.

```ts
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--screen-info={800x600}'],
  });

  async function logWindowBounds() {
    const bounds = await browser.getWindowBounds(windowId);
    console.log(
      `${bounds.left},${bounds.top}` +
        ` ${bounds.width}x${bounds.height}` +
        ` ${bounds.windowState}`,
    );
  }

  // Create new page.
  const page = await browser.newPage({type: 'window'});
  const windowId = await page.windowId();
  await logWindowBounds();

  // Add a screen to the right of the primary screen.
  const screenInfo = await browser.addScreen({
    left: 800,
    top: 0,
    width: 1600,
    height: 1200,
  });

  // Move the window to the newly created secondary screen.
  await browser.setWindowBounds(windowId, {
    left: screenInfo.left + 50,
    top: screenInfo.top + 50,
    width: screenInfo.width - 100,
    height: screenInfo.height - 100,
  });
  await logWindowBounds();

  // Maximize the window.
  await browser.setWindowBounds(windowId, {windowState: 'maximized'});
  await logWindowBounds();

  // Restore the window.
  await browser.setWindowBounds(windowId, {windowState: 'normal'});
  await logWindowBounds();

  await browser.close();
})();
```

Output:

```
20,20 780x580 normal
850,50 1500x1100 normal
800,0 1600x1200 maximized
850,50 1500x1100 normal
```

## Sizing page content

Use Puppeteer's [`Page.resize`](https://pptr.dev/api/puppeteer.page.resize) method to adjust the browser window size so that the content has the specified size.

Example:

```ts
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--screen-info={800x600}'],
  });

  const page = (await browser.pages())[0];

  // Default viewport restricts window to 800x600, so remove it.
  await page.setViewport(null);

  // Inner window size is updated asynchronously, so wait for
  // the window size change to get reported before logging it.
  const resized = page.evaluate(() => {
    return new Promise(resolve => {
      window.onresize = resolve;
    });
  });

  await page.resize({contentWidth: 600, contentHeight: 400});
  await resized;

  const result = await page.evaluate(() => {
    return (
      `Inner size: ${window.innerWidth}x${window.innerHeight}\n` +
      `Outer size: ${window.outerWidth}x${window.outerHeight}`
    );
  });

  console.log(result);

  await browser.close();
})();
```

Output:

```
Inner size: 600x400
Outer size: 600x487
```

## Fullscreen element

The following example demonstrates how to request full-screen mode for an element on click.

```ts
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--screen-info={1600x1200}'],
  });

  const page = (await browser.pages())[0];
  await page.setContent(`
    <div id="click-box" style="width: 10px; height: 10px;"/>
  `);

  await page.evaluate(() => {
    const element = document.getElementById('click-box');
    element.addEventListener('click', () => {
      element.requestFullscreen();
    });
  });

  await page.click('#click-box');

  const windowId = await page.windowId();
  const bounds = await browser.getWindowBounds(windowId);
  console.log(
    `${bounds.left},${bounds.top}` +
      ` ${bounds.width}x${bounds.height}` +
      ` ${bounds.windowState}`,
  );

  await browser.close();
})();
```

Output:

```
0,0 1600x1200 fullscreen
```
