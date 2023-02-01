---
sidebar_label: HTTPRequest.interceptResolutionState
---

# HTTPRequest.interceptResolutionState() method

#### Signature:

```typescript
class HTTPRequest {
  interceptResolutionState(): InterceptResolutionState;
}
```

**Returns:**

[InterceptResolutionState](./puppeteer.interceptresolutionstate.md)

An InterceptResolutionState object describing the current resolution action and priority.

InterceptResolutionState contains: action: InterceptResolutionAction priority?: number

InterceptResolutionAction is one of: `abort`, `respond`, `continue`, `disabled`, `none`, or `already-handled`.
