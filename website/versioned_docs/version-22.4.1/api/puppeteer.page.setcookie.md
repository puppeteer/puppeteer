---
sidebar_label: Page.setCookie
---

# Page.setCookie() method

#### Signature:

```typescript
class Page {
  abstract setCookie(...cookies: CookieParam[]): Promise<void>;
}
```

## Parameters

| Parameter | Type                                          | Description |
| --------- | --------------------------------------------- | ----------- |
| cookies   | [CookieParam](./puppeteer.cookieparam.md)\[\] |             |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.setCookie(cookieObject1, cookieObject2);
```
