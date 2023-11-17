---
sidebar_label: Page.setUserAgent
---

# Page.setUserAgent() method

#### Signature:

```typescript
class Page {
  abstract setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata
  ): Promise<void>;
}
```

## Parameters

| Parameter         | Type                                 | Description                             |
| ----------------- | ------------------------------------ | --------------------------------------- |
| userAgent         | string                               | Specific user agent to use in this page |
| userAgentMetadata | Protocol.Emulation.UserAgentMetadata | _(Optional)_                            |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the user agent is set.

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
