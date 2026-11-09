---
sidebar_label: RemoteException.name
---

# RemoteException.name() method

The name of the exception, for example `Error`, `TypeError`, `SyntaxError` or `AbortError`.

### Signature

```typescript
class RemoteException {
  name(): string | null;
}
```

**Returns:**

string \| null

## Remarks

This is the `name` of the thrown error as rendered by the browser, which can differ from its constructor (for example `AbortError` for a `DOMException`).

Empty string if the thrown value is not an error, for example a primitive, a plain object or a symbol.

Always `null` with WebDriver BiDi, which does not report the name of the exception.
