---
sidebar_label: HTTPRequest.continueRequestOverrides
---

# HTTPRequest.continueRequestOverrides() method

The `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).

#### Signature:

```typescript
class HTTPRequest &#123;abstract continueRequestOverrides(): ContinueRequestOverrides;&#125;
```

**Returns:**

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)
