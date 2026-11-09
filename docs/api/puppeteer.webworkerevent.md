---
sidebar_label: WebWorkerEvent
---

# WebWorkerEvent enum

### Signature

```typescript
export declare enum WebWorkerEvent
```

## Enumeration Members

<table><thead><tr><th>

Member

</th><th>

Value

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

Console

</td><td>

`"console"`

</td><td>

Emitted when the worker calls a console API.

</td></tr>
<tr><td>

Error

</td><td>

`"error"`

</td><td>

Emitted when the worker throws an exception.

**Deprecated:**

Use [WebWorkerEvent.Exception](./puppeteer.webworkerevent.md) instead.

</td></tr>
<tr><td>

Exception

</td><td>

`"exception"`

</td><td>

Emitted when an uncaught exception happens within the worker. Contains a [RemoteException](./puppeteer.remoteexception.md).

**Remarks:**

The [handle](./puppeteer.remoteexception.handle.md) of the exception is disposed right after the event has been dispatched. Call `move()` on it synchronously inside the listener to keep it alive.

</td></tr>
</tbody></table>
