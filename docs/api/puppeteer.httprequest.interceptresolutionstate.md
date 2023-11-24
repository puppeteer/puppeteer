---
sidebar_label: HTTPRequest.interceptResolutionState
---

# HTTPRequest.interceptResolutionState() method

An InterceptResolutionState object describing the current resolution action and priority.

InterceptResolutionState contains: action: InterceptResolutionAction priority?: number

InterceptResolutionAction is one of: `abort`, `respond`, `continue`, `disabled`, `none`, or `already-handled`.

#### Signature:

```typescript
class HTTPRequest &#123;abstract interceptResolutionState(): InterceptResolutionState;&#125;
```

**Returns:**

[InterceptResolutionState](./puppeteer.interceptresolutionstate.md)
