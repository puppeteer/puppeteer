---
sidebar_label: ContinueRequestOverrides
---

# ContinueRequestOverrides interface

#### Signature:

```typescript
export interface ContinueRequestOverrides
```

## Properties

| Property | Modifiers             | Type                         | Description                                                  | Default |
| -------- | --------------------- | ---------------------------- | ------------------------------------------------------------ | ------- |
| headers  | <code>optional</code> | Record&lt;string, string&gt; |                                                              |         |
| method   | <code>optional</code> | string                       |                                                              |         |
| postData | <code>optional</code> | string                       |                                                              |         |
| url      | <code>optional</code> | string                       | If set, the request URL will change. This is not a redirect. |         |
