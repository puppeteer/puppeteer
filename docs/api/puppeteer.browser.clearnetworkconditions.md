---
sidebar_label: Browser.clearNetworkConditions
---

# Browser.clearNetworkConditions() method

Clears the current network conditions (blocklist and allowlist) and re-applies the empty conditions to all targets.

### Signature

```typescript
class Browser {
  clearNetworkConditions(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Remarks

Currently only supported for Chrome and the CDP protocol.
