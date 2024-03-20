---
sidebar_label: ConsoleMessageLocation
---

# ConsoleMessageLocation interface

#### Signature:

```typescript
export interface ConsoleMessageLocation
```

## Properties

| Property     | Modifiers             | Type   | Description                                                                         | Default |
| ------------ | --------------------- | ------ | ----------------------------------------------------------------------------------- | ------- |
| columnNumber | <code>optional</code> | number | 0-based column number in the resource if known or <code>undefined</code> otherwise. |         |
| lineNumber   | <code>optional</code> | number | 0-based line number in the resource if known or <code>undefined</code> otherwise.   |         |
| url          | <code>optional</code> | string | URL of the resource if known or <code>undefined</code> otherwise.                   |         |
