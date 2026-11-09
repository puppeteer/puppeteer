---
sidebar_label: RemoteException.location
---

# RemoteException.location() method

The primary location where the exception occurred.

### Signature

```typescript
class RemoteException {
  location(): CallFrame;
}
```

**Returns:**

[CallFrame](./puppeteer.callframe.md)

## Remarks

For runtime errors this is `stackTrace()[0]`. For compilation and syntax errors (where `stackTrace()` is empty), it falls back to the top-level coordinates reported for the exception.
