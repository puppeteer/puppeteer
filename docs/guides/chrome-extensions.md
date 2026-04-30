# Chrome Extensions

Puppeteer can be used for testing Chrome Extensions.

## Load extensions

### Using `LaunchOptions`

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: [pathToExtension],
});
```

### At runtime

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: true,
});

const extensionId = await browser.installExtension(pathToExtension);
```

### Listing and uninstalling

You can list all installed extensions and their properties using the `browser.extensions()` method. To uninstall an extension, use the `browser.uninstallExtension()` method.

```ts
const extensions = await browser.extensions();
const extension = extensions.get(extensionId);

console.log(extension?.name);
console.log(extension?.version);

await browser.uninstallExtension(extensionId);
```

## Background contexts

You can get a reference to the extension service worker or background page, which can be useful for evaluating code in the extension context or forcefully terminating the service worker.

### Service worker (MV3)

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: [pathToExtension],
});

const workerTarget = await browser.waitForTarget(
  // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
  target =>
    target.type() === 'service_worker' &&
    target.url().endsWith('background.js'),
);

const worker = await workerTarget.worker();

// Test the service worker.

await browser.close();
```

### Background page (MV2)

The following is code for getting a handle to the
[background page](https://developer.chrome.com/extensions/background_pages) of
an extension whose source is located in `./my-extension`:

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: [pathToExtension],
});
const backgroundPageTarget = await browser.waitForTarget(
  target => target.type() === 'background_page',
);
const backgroundPage = await backgroundPageTarget.page();

// Test the background page as you would any other page.

await browser.close();
```

## Popup

Access the service worker [as above](#service-worker-mv3). Then:

```ts
await worker.evaluate('chrome.action.openPopup();');

const popupTarget = await browser.waitForTarget(
  // Assumes that there is only one page with the URL ending with popup.html
  // and that is the popup created by the extension.
  target => target.type() === 'page' && target.url().endsWith('popup.html'),
);

const popupPage = await popupTarget.asPage();

// Test the popup page as you would any other page.

await browser.close();
```

## Triggering extension action

You can trigger the default extension action for a page using the `page.triggerExtensionAction()` method. This will trigger the extension's action as if the user clicked the extension's button in the toolbar.

```ts
const extensions = await browser.extensions();
const extension = extensions.get(extensionId);

// You can trigger the action for a specific extension on a page.
await page.triggerExtensionAction(extension);

// Alternatively, you can trigger it from the extension object itself.
await extension.triggerAction(page);

// If the action opens a popup, you can then wait for the popup target.
const popupTarget = await browser.waitForTarget(
  target =>
    target.type() === 'page' &&
    target.url().includes(extensionId) &&
    target.url().endsWith('popup.html'),
);
```

## Content scripts

Content scripts are injected as normal. Use `browser.newPage()` and `page.goto()` to navigate to a page where a content script will be injected.

To evaluate code in the context of a content script, you can use the `page.extensionRealms()` method to find the realm associated with the extension and then use its `evaluate()` method.

```ts
// Get the extension ID
const extensionId = await browser.installExtension(pathToExtension);

// Find the extension realm.
const realms = page.extensionRealms();
let extensionRealm;
for (const realm of realms) {
  const extension = await realm.extension();
  if (extension?.id === extensionId) {
    extensionRealm = realm;
    break;
  }
}

if (!extensionRealm) {
  throw new Error('Extension realm not found');
}

// Evaluate code in the content script context.
const result = await extensionRealm.evaluate(() => {
  return document.title;
});
```

## Learn more

To learn more, see the documentation on [Chrome for Developers](https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing).
