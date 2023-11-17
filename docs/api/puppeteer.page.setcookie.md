---
sidebar_label: Page.setCookie
---

# Page.setCookie() method

#### Signature:

```typescript
class Page {
  abstract setCookie(...cookies: Protocol.Network.CookieParam[]): Promise<void>;
}
```

## Parameters

| Parameter | Type                             | Description |
| --------- | -------------------------------- | ----------- |
| cookies   | Protocol.Network.CookieParam\[\] |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).

## Example

```ts
await page.setCookie(cookieObject1, cookieObject2);
```
