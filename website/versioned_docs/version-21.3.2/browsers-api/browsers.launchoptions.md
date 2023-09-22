---
sidebar_label: LaunchOptions
---

# LaunchOptions interface

#### Signature:

```typescript
export interface LaunchOptions
```

## Properties

| Property       | Modifiers             | Type                                      | Description | Default |
| -------------- | --------------------- | ----------------------------------------- | ----------- | ------- |
| args           | <code>optional</code> | string\[\]                                |             |         |
| detached       | <code>optional</code> | boolean                                   |             |         |
| dumpio         | <code>optional</code> | boolean                                   |             |         |
| env            | <code>optional</code> | Record&lt;string, string \| undefined&gt; |             |         |
| executablePath |                       | string                                    |             |         |
| handleSIGHUP   | <code>optional</code> | boolean                                   |             |         |
| handleSIGINT   | <code>optional</code> | boolean                                   |             |         |
| handleSIGTERM  | <code>optional</code> | boolean                                   |             |         |
| onExit         | <code>optional</code> | () =&gt; Promise&lt;void&gt;              |             |         |
| pipe           | <code>optional</code> | boolean                                   |             |         |
