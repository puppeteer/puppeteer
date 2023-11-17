---
sidebar_label: HTTPRequest.interceptResolutionState
---

# HTTPRequest.interceptResolutionState() method

An InterceptResolutionState object describing the current resolution action and priority.

InterceptResolutionState contains: action: InterceptResolutionAction priority?: number

InterceptResolutionAction is one of: `abort`, `respond`, `continue`, `disabled`, `none`, or `already-handled`.

#### Signature:

```typescript
class HTTPRequest {
  abstract interceptResolutionState(): InterceptResolutionState;
}
```

**Returns:**

[InterceptResolutionState](./puppeteer.interceptresolutionstate.md)

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
