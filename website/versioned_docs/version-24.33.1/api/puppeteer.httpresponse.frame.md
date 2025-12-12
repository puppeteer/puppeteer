---
sidebar_label: HTTPResponse.frame
---

# HTTPResponse.frame() method

A [Frame](./puppeteer.frame.md) that initiated this response, or `null` if navigating to error pages.

### Signature

```typescript
class HTTPResponse {
  abstract frame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null
