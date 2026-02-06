# Screen configuration

Use [`--screen-info`](https://chromium.googlesource.com/chromium/src/+/main/components/headless/screen_info/README.md) command line switch to configure headless screen.

The following script configures Chrome to run in a dual-screen configuration. The primary 800x600 screen is configured in a landscape orientation, and the secondary 600x800 screen, positioned directly to the right of the primary screen, is in a portrait orientation.

```ts
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--screen-info={800x600 label=1st}{600x800 label=2nd}'],
  });

  const screens = await browser.screens();
  const screenInfos = screens.map(
    s =>
      `Screen [${s.id}]` +
      ` ${s.left},${s.top} ${s.width}x${s.height}` +
      ` label='${s.label}'` +
      ` isPrimary=${s.isPrimary}` +
      ` isExtended=${s.isExtended}` +
      ` isInternal=${s.isInternal}` +
      ` colorDepth=${s.colorDepth}` +
      ` devicePixelRatio=${s.devicePixelRatio}` +
      ` avail=${s.availLeft},${s.availTop} ${s.availWidth}x${s.availHeight}` +
      ` orientation.type=${s.orientation.type}` +
      ` orientation.angle=${s.orientation.angle}`,
  );

  console.log(
    `Number of screens: ${screens.length}\n` + screenInfos.join('\n'),
  );

  await browser.close();
})();
```

Output:

```
Number of screens: 2
Screen [1] 0,0 800x600 label='1st' isPrimary=true isExtended=true isInternal=false colorDepth=24 devicePixelRatio=1 avail=0,0 800x600 orientation.type=landscapePrimary orientation.angle=0
Screen [2] 800,0 600x800 label='2nd' isPrimary=false isExtended=true isInternal=false colorDepth=24 devicePixelRatio=1 avail=800,0 600x800 orientation.type=portraitPrimary orientation.angle=0
```

With no `--screen-info` switch, the headless screen has one 800x600 screen unless the `--window-size` switch is specified, in which case the headless screen is as large as the requested window size.

:::caution

The `--screen-info` switch is only available in headless mode. Headful Chrome always uses physical platform screens.

:::

## Dynamic headless screen configuration

Use Puppeteer's [`Browser.addScreen`](https://pptr.dev/next/api/puppeteer.browser.addscreen) and [`Browser.removeScreen`](https://pptr.dev/next/api/puppeteer.browser.removescreen) methods to add and remove screens while Chrome browser is running. Use [`Browser.screens`](https://pptr.dev/next/api/puppeteer.browser.screens) method to retrieve the current screen configuration.

The following script adds and removes a secondary screen while logging the screen configuration at each step.

```ts
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--screen-info={800x600 label=1st}'],
  });

  function getScreenInfo(s) {
    return (
      `Screen [${s.id}]` +
      ` ${s.left},${s.top} ${s.width}x${s.height}` +
      ` label='${s.label}'` +
      ` isPrimary=${s.isPrimary}` +
      ` isExtended=${s.isExtended}`
    );
  }

  async function logScreenConfig(text) {
    if (text !== undefined) {
      console.log(text);
    }
    const screens = await browser.screens();
    const screenInfos = screens.map(s => getScreenInfo(s));

    console.log(
      `Number of screens: ${screens.length}\n` + screenInfos.join('\n'),
    );
  }

  await logScreenConfig('---- Initial:');

  // Add a screen.
  const addedScreenInfo = await browser.addScreen({
    left: 800,
    top: 0,
    width: 800,
    height: 600,
    label: '2nd',
  });

  console.log('Added screen: ' + getScreenInfo(addedScreenInfo));
  await logScreenConfig('---- With the screen added:');

  // Remove the added screen.
  await browser.removeScreen(addedScreenInfo.id);
  await logScreenConfig('---- With added screen removed:');

  await browser.close();
})();
```

Output:

```
---- Initial:
Number of screens: 1
Screen [1] 0,0 800x600 label='1st' isPrimary=true isExtended=false
Added screen: Screen [2] 800,0 800x600 label='2nd' isPrimary=false isExtended=true
---- With the screen added:
Number of screens: 2
Screen [1] 0,0 800x600 label='1st' isPrimary=true isExtended=true
Screen [2] 800,0 800x600 label='2nd' isPrimary=false isExtended=true
---- With added screen removed:
Number of screens: 1
Screen [1] 0,0 800x600 label='1st' isPrimary=true isExtended=false
```

:::caution

The `Browser.addScreen` and `Browser.removeScreen` methods are only available in headless mode. The `Browser.screens` method is available in both headful and headless modes.

:::
