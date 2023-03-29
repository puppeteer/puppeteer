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

| Property    | Modifiers | Type                          | Description                                                     | Default |
| ----------- | --------- | ----------------------------- | --------------------------------------------------------------- | ------- |
| body        |           | string \| Buffer              |                                                                 |         |
| contentType |           | string                        |                                                                 |         |
| headers     |           | Record&lt;string, unknown&gt; | Optional response headers. All values are converted to strings. |         |
| status      |           | number                        |                                                                 |         |
