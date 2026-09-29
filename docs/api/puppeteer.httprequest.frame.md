---
sidebar_label: HTTPRequest.frame
---

# HTTPRequest.frame() method

The frame that initiated the request, or null if navigating to error pages or the request is coming from a worker.

### Signature

```typescript
class HTTPRequest {
  abstract frame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null
