---
sidebar_label: CommonEventEmitter.emit
---

# CommonEventEmitter.emit() method

#### Signature:

```typescript
interface CommonEventEmitter {
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): boolean;
}
```

## Parameters

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| type      | Key           |             |
| event     | Events\[Key\] |             |

**Returns:**

boolean
