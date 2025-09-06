---
sidebar_label: HTTPRequest.documentId
---

# HTTPRequest.documentId() method

Returns an opaque ID of the document associated with the request. When a new document gets loaded into a frame, a new documentId is genereated to identify the navigation request and all resource requests originated from this document.

documentId is an empty string for requests related to workers.

### Signature

```typescript
class HTTPRequest {
  abstract documentId(): string;
}
```

**Returns:**

string
