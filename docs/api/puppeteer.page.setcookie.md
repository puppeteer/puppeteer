---
sidebar_label: Page.setCookie
---

# Page.setCookie() method

#### Signature:

```typescript
class Page &#123;abstract setCookie(...cookies: Protocol.Network.CookieParam[]): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                             | Description |
| --------- | -------------------------------- | ----------- |
| cookies   | Protocol.Network.CookieParam\[\] |             |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.setCookie(cookieObject1, cookieObject2);
```
