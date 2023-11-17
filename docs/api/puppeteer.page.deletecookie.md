---
sidebar_label: Page.deleteCookie
---

# Page.deleteCookie() method

#### Signature:

```typescript
class Page {
  abstract deleteCookie(
    ...cookies: Protocol.Network.DeleteCookiesRequest[]
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                      | Description |
| --------- | ----------------------------------------- | ----------- |
| cookies   | Protocol.Network.DeleteCookiesRequest\[\] |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
