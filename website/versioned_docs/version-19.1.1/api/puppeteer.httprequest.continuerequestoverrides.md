---
sidebar_label: HTTPRequest.continueRequestOverrides
---

# HTTPRequest.continueRequestOverrides() method

#### Signature:

```typescript
class HTTPRequest {
  continueRequestOverrides(): ContinueRequestOverrides;
}
```

**Returns:**

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)

the `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).
