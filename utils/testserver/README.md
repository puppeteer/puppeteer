# TestServer

This test server is used internally by Puppeteer to test Puppeteer itself.

### Example

```js
const {TestServer} = require('@pptr/testserver');

(async(() => {
  const httpServer = await TestServer.create(__dirname, 8000),
  const httpsServer = await TestServer.createHTTPS(__dirname, 8001)
  httpServer.setRoute('/hello', (req, res) => {
    res.end('Hello, world!');
  });
  console.log('HTTP and HTTPS servers are running!');
})();
```
