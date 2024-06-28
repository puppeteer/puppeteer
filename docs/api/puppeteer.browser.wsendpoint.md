---
sidebar_label: Browser.wsEndpoint
---

# Browser.wsEndpoint() method

### Signature:

```typescript
class Browser {
  abstract wsEndpoint(): string;
}
```

Gets the WebSocket URL to connect to this [browser](./puppeteer.browser.md).

This is usually used with [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

You can find the debugger URL (`webSocketDebuggerUrl`) from `http://HOST:PORT/json/version`.

See [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target) for more information.

**Returns:**

string

## Remarks

The format is always `ws://HOST:PORT/devtools/browser/<id>`.
