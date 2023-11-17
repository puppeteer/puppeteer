---
sidebar_label: HTTPRequest.continueRequestOverrides
---

# HTTPRequest.continueRequestOverrides() method

The `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).

#### Signature:

```typescript
class HTTPRequest {
  abstract continueRequestOverrides(): ContinueRequestOverrides;
}
```

**Returns:**

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
