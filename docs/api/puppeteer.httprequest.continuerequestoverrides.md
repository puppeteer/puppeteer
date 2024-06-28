---
sidebar_label: HTTPRequest.continueRequestOverrides
---

# HTTPRequest.continueRequestOverrides() method

### Signature:

```typescript
class HTTPRequest {
  continueRequestOverrides(): ContinueRequestOverrides;
}
```

The `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).

**Returns:**

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)
