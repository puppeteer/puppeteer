---
sidebar_label: Page.cookies
---

# Page.cookies() method

If no URLs are specified, this method returns cookies for the current page URL. If URLs are specified, only cookies for those URLs are returned.

#### Signature:

```typescript
class Page {
  abstract cookies(...urls: string[]): Promise<Protocol.Network.Cookie[]>;
}
```

## Parameters

| Parameter | Type       | Description |
| --------- | ---------- | ----------- |
| urls      | string\[\] |             |

**Returns:**

Promise&lt;Protocol.Network.Cookie\[\]&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
