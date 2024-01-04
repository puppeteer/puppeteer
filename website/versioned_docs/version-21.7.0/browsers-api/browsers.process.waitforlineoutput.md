---
sidebar_label: Process.waitForLineOutput
---

# Process.waitForLineOutput() method

#### Signature:

```typescript
class Process {
  waitForLineOutput(regex: RegExp, timeout?: number): Promise<string>;
}
```

## Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| regex     | RegExp |              |
| timeout   | number | _(Optional)_ |

**Returns:**

Promise&lt;string&gt;
