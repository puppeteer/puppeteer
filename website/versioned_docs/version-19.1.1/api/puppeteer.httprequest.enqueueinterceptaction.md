---
sidebar_label: HTTPRequest.enqueueInterceptAction
---

# HTTPRequest.enqueueInterceptAction() method

Adds an async request handler to the processing queue. Deferred handlers are not guaranteed to execute in any particular order, but they are guaranteed to resolve before the request interception is finalized.

#### Signature:

```typescript
class HTTPRequest {
  enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>
  ): void;
}
```

## Parameters

| Parameter      | Type                                        | Description |
| -------------- | ------------------------------------------- | ----------- |
| pendingHandler | () =&gt; void \| PromiseLike&lt;unknown&gt; |             |

**Returns:**

void
