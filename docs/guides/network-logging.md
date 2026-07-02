# Network logging

By default, Puppeteer listens for all network requests and responses and emits network events on the page.

```ts
const page = await browser.newPage();
page.on('request', request => {
  console.log(request.url());
});

page.on('response', response => {
  console.log(response.url());
});
```
