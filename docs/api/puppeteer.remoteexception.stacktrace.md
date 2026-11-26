---
sidebar_label: RemoteException.stackTrace
---

# RemoteException.stackTrace() method

The call frames on the stack at the time the exception was thrown, innermost first.

### Signature

```typescript
class RemoteException {
  stackTrace(): CallFrame[];
}
```

**Returns:**

[CallFrame](./puppeteer.callframe.md)\[\]

## Remarks

Empty for compilation and syntax errors.
