---
sidebar_label: HTTPRequest.frame
---

# HTTPRequest.frame() method

**Signature:**

```typescript
class HTTPRequest {
  frame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null

the frame that initiated the request, or null if navigating to error pages.
