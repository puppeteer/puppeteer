---
sidebar_label: HTTPRequest.hasPostData
---

# HTTPRequest.hasPostData() method

### Signature:

```typescript
class HTTPRequest {
  abstract hasPostData(): boolean;
}
```

True when the request has POST data. Note that [HTTPRequest.postData()](./puppeteer.httprequest.postdata.md) might still be undefined when this flag is true when the data is too long or not readily available in the decoded form. In that case, use [HTTPRequest.fetchPostData()](./puppeteer.httprequest.fetchpostdata.md).

**Returns:**

boolean
