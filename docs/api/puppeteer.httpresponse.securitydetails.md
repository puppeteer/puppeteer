---
sidebar_label: HTTPResponse.securityDetails
---

# HTTPResponse.securityDetails() method

[SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or `null` otherwise.

#### Signature:

```typescript
class HTTPResponse {
  abstract securityDetails(): SecurityDetails | null;
}
```

**Returns:**

[SecurityDetails](./puppeteer.securitydetails.md) \| null

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
