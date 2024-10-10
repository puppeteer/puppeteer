# Getting started

Puppeteer will be familiar to people using other browser testing frameworks. You
[launch](https://pptr.dev/api/puppeteer.puppeteernode.launch)/[connect](https://pptr.dev/api/puppeteer.puppeteernode.connect)
a [browser](https://pptr.dev/api/puppeteer.browser),
[create](https://pptr.dev/api/puppeteer.browser.newpage) some
[pages](https://pptr.dev/api/puppeteer.page), and then manipulate them with
[Puppeteer's API](https://pptr.dev/api).

The following example searches [developer.chrome.com](https://developer.chrome.com/) for blog posts with text "automate beyond recorder", click on the first result and print the full title of the blog post.

```ts
import puppeteer from 'puppeteer';

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://developer.chrome.com/');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Type into search box
  await page.type('.devsite-search-field', 'automate beyond recorder');

  // Wait and click on first result
  const searchResultSelector = '.devsite-result-item-link';
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  // Locate the full title with a unique string
  const textSelector = await page.waitForSelector(
    'text/Customize and automate'
  );
  const fullTitle = await textSelector?.evaluate(el => el.textContent);

  // Print the full title
  console.log('The title of this blog post is "%s".', fullTitle);

  await browser.close();
})();
```

For more in-depth usage, check our [documentation](https://pptr.dev/docs)
and [examples](https://github.com/puppeteer/puppeteer/tree/main/examples).
