---
sidebar_label: Page.waitForTimeout
---

# Page.waitForTimeout() method

Causes your script to wait for the given number of milliseconds.

**Signature:**

```typescript
class Page {
  waitForTimeout(milliseconds: number): Promise<void>;
}
```

## Parameters

| Parameter    | Type   | Description                         |
| ------------ | ------ | ----------------------------------- |
| milliseconds | number | the number of milliseconds to wait. |

**Returns:**

Promise&lt;void&gt;

## Remarks

It's generally recommended to not wait for a number of seconds, but instead use [Page.waitForSelector()](./puppeteer.page.waitforselector.md), [Page.waitForXPath()](./puppeteer.page.waitforxpath.md) or [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) to wait for exactly the conditions you want.

## Example

Wait for 1 second:

```ts
await page.waitForTimeout(1000);
```
