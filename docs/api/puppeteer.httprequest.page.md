---
sidebar_label: HTTPRequest.page
---

# HTTPRequest.page() method

The page that initiated the request, or null if navigating to error pages or the request is coming from a worker.

### Signature

```typescript
class HTTPRequest {
  abstract page(): Page | null;
}
```

**Returns:**

[Page](./puppeteer.page.md) \| null
