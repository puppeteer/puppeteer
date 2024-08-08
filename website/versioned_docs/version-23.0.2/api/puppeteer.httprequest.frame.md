---
sidebar_label: HTTPRequest.frame
---

# HTTPRequest.frame() method

The frame that initiated the request, or null if navigating to error pages.

### Signature

```typescript
class HTTPRequest {
  abstract frame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null
