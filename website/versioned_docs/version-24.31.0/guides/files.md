# Files

Currently, Puppeteer does not offer a way to handle file downloads in a programmatic way.
For uploading files, you need to locate a file input element and call [`ElementHandle.uploadFile`](https://pptr.dev/api/puppeteer.elementhandle.uploadfile).

```ts
const fileElement = await page.waitForSelector('input[type=file]');
await fileElement.uploadFile(['./path-to-local-file']);
```
