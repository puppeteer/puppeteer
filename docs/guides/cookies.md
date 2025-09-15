# Cookies

Puppeteer offers methods to get, set and delete cookies ahead of time by
manipulating browser storage directly. This is useful if you need to
store and restore specific cookies for your tests.

## Getting cookies

The following example demonstrates how to get cookies available in the
browser's default
[BrowserContext](https://pptr.dev/api/puppeteer.browsercontext).

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

const page = await browser.newPage();

await page.goto('https://example.com');

// In this example, we set a cookie using script evaluation.
// Cookies can be set by the page/server in various ways.
await page.evaluate(() => {
  document.cookie = 'myCookie = MyCookieValue';
});

console.log(await browser.cookies()); // print available cookies.
```

## Setting cookies

Puppeteer can also write cookies directly into the browser's storage:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

// Sets two cookies for the localhost domain.
await browser.setCookie(
  {
    name: 'cookie1',
    value: '1',
    domain: 'localhost',
    path: '/',
    sameParty: false,
    expires: -1,
    httpOnly: false,
    secure: false,
    sourceScheme: 'NonSecure',
  },
  {
    name: 'cookie2',
    value: '2',
    domain: 'localhost',
    path: '/',
    sameParty: false,
    expires: -1,
    httpOnly: false,
    secure: false,
    sourceScheme: 'NonSecure',
  },
);

console.log(await browser.cookies()); // print available cookies.
```

## Deleting cookies

[Browser.deleteCookie()](https://pptr.dev/api/puppeteer.browser.deletecookie) method allows deleting cookies from storage.

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

// Deletes two cookies for the localhost domain.
await browser.deleteCookie(
  {
    name: 'cookie1',
    value: '1',
    domain: 'localhost',
    path: '/',
    sameParty: false,
    expires: -1,
    httpOnly: false,
    secure: false,
    sourceScheme: 'NonSecure',
  },
  {
    name: 'cookie2',
    value: '2',
    domain: 'localhost',
    path: '/',
    sameParty: false,
    expires: -1,
    httpOnly: false,
    secure: false,
    sourceScheme: 'NonSecure',
  },
);

console.log(await browser.cookies()); // print available cookies.
```

In addition to the `Browser` methods operating on the default browser
context, the same methods are available on the
[`BrowserContext`](https://pptr.dev/api/puppeteer.browsercontext) class.
