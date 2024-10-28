---
sidebar_label: HTTPRequest.enqueueInterceptAction
---

# HTTPRequest.enqueueInterceptAction() method

Adds an async request handler to the processing queue. Deferred handlers are not guaranteed to execute in any particular order, but they are guaranteed to resolve before the request interception is finalized.

### Signature

```typescript
class HTTPRequest {
  enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>,
  ): void;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

pendingHandler

</td><td>

() =&gt; void \| PromiseLike&lt;unknown&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void
