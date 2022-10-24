---
sidebar_label: Browser.wsEndpoint
---

# Browser.wsEndpoint() method

The browser websocket endpoint which can be used as an argument to [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

#### Signature:

```typescript
class Browser {
  wsEndpoint(): string;
}
```

**Returns:**

string

The Browser websocket url.

## Remarks

The format is `ws://${host}:${port}/devtools/browser/<id>`.

You can find the `webSocketDebuggerUrl` from `http://${host}:${port}/json/version`. Learn more about the [devtools protocol](https://chromedevtools.github.io/devtools-protocol) and the [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target).
