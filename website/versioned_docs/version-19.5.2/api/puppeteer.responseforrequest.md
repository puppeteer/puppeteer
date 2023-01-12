---
sidebar_label: ResponseForRequest
---

# ResponseForRequest interface

Required response data to fulfill a request with.

#### Signature:

```typescript
export interface ResponseForRequest
```

## Properties

| Property                                                     | Modifiers | Type                          | Description                                                     | Default |
| ------------------------------------------------------------ | --------- | ----------------------------- | --------------------------------------------------------------- | ------- |
| [body](./puppeteer.responseforrequest.body.md)               |           | string \| Buffer              |                                                                 |         |
| [contentType](./puppeteer.responseforrequest.contenttype.md) |           | string                        |                                                                 |         |
| [headers](./puppeteer.responseforrequest.headers.md)         |           | Record&lt;string, unknown&gt; | Optional response headers. All values are converted to strings. |         |
| [status](./puppeteer.responseforrequest.status.md)           |           | number                        |                                                                 |         |
