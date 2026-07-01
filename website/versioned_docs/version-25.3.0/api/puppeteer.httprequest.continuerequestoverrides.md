---
sidebar_label: HTTPRequest.continueRequestOverrides
---

# HTTPRequest.continueRequestOverrides() method

The `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).

### Signature

```typescript
class HTTPRequest {
  continueRequestOverrides(): ContinueRequestOverrides;
}
```

**Returns:**

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)
