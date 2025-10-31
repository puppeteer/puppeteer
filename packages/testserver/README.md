# TestServer

This test server is used internally by Puppeteer to test Puppeteer itself.

### Example

```ts
import {TestServer} from '@pptr/testserver';

const httpServer = await TestServer.create(import.meta.dirname, 8000);
const httpsServer = await TestServer.createHTTPS(import.meta.dirname, 8001);
httpServer.setRoute('/hello', (req, res) => {
  res.end('Hello, world!');
});
console.log('HTTP and HTTPS servers are running!');
```
