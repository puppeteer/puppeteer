---
sidebar_label: HTTPResponse.frame
---

# HTTPResponse.frame() method

**Signature:**

```typescript
class HTTPResponse {
  frame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null

A [Frame](./puppeteer.frame.md) that initiated this response, or `null` if navigating to error pages.
