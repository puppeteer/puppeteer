---
sidebar_label: HTTPResponse.frame
---

# HTTPResponse.frame() method

### Signature:

```typescript
class HTTPResponse {
  abstract frame(): Frame | null;
}
```

A [Frame](./puppeteer.frame.md) that initiated this response, or `null` if navigating to error pages.

**Returns:**

[Frame](./puppeteer.frame.md) \| null
