---
sidebar_label: RemoteException.text
---

# RemoteException.text() method

The text of the exception as rendered by the browser, for example `Error: boom` or `TypeError: Cannot read properties of undefined (reading 'foo')`.

### Signature

```typescript
class RemoteException {
  text(): string;
}
```

**Returns:**

string

## Remarks

For errors this is `${name}: ${message}` (or just the name if the message is empty), without the stack. For other thrown values it is their description, for example `Object` for a plain object or the string itself for a thrown string.
