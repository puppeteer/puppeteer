---
sidebar_label: Page.cookies
---

# Page.cookies() method

If no URLs are specified, this method returns cookies for the current page URL. If URLs are specified, only cookies for those URLs are returned.

#### Signature:

```typescript
class Page &#123;abstract cookies(...urls: string[]): Promise<Protocol.Network.Cookie[]>;&#125;
```

## Parameters

| Parameter | Type       | Description |
| --------- | ---------- | ----------- |
| urls      | string\[\] |             |

**Returns:**

Promise&lt;Protocol.Network.Cookie\[\]&gt;
