---
sidebar_label: Target.createCDPSession
---

# Target.createCDPSession() method

### Signature:

```typescript
class Target {
  abstract createCDPSession(): Promise<CDPSession>;
}
```

Creates a Chrome Devtools Protocol session attached to the target.

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;
