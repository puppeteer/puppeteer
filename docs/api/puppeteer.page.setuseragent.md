---
sidebar_label: Page.setUserAgent
---

# Page.setUserAgent() method

#### Signature:

```typescript
class Page &#123;abstract setUserAgent(userAgent: string, userAgentMetadata?: Protocol.Emulation.UserAgentMetadata): Promise<void>;&#125;
```

## Parameters

| Parameter         | Type                                 | Description                             |
| ----------------- | ------------------------------------ | --------------------------------------- |
| userAgent         | string                               | Specific user agent to use in this page |
| userAgentMetadata | Protocol.Emulation.UserAgentMetadata | _(Optional)_                            |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the user agent is set.
