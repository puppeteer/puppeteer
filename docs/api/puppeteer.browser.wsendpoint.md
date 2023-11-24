---
sidebar_label: Browser.wsEndpoint
---

# Browser.wsEndpoint() method

Gets the WebSocket URL to connect to this [browser](./puppeteer.browser.md).

This is usually used with [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

You can find the debugger URL (`webSocketDebuggerUrl`) from `http://$&#123;host&#125;:$&#123;port&#125;/json/version`.

See [browser endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target) for more information.

#### Signature:

```typescript
class Browser &#123;abstract wsEndpoint(): string;&#125;
```

**Returns:**

string

## Remarks

The format is always `ws://$&#123;host&#125;:$&#123;port&#125;/devtools/browser/<id>`.
