---
sidebar_label: Puppeteer.connect
---

# Puppeteer.connect() method

This method attaches Puppeteer to an existing browser instance.

#### Signature:

```typescript
class Puppeteer &#123;connect(options: ConnectOptions): Promise<Browser>;&#125;
```

## Parameters

| Parameter | Type                                            | Description                                        |
| --------- | ----------------------------------------------- | -------------------------------------------------- |
| options   | [ConnectOptions](./puppeteer.connectoptions.md) | Set of configurable options to set on the browser. |

**Returns:**

Promise&lt;[Browser](./puppeteer.browser.md)&gt;

Promise which resolves to browser instance.

## Remarks
