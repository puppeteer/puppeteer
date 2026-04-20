---
sidebar_label: Target.createCDPSession
---

# Target.createCDPSession() method

Creates a Chrome Devtools Protocol session attached to the target.

### Signature

```typescript
class Target {
  abstract createCDPSession(): Promise<CDPSession>;
}
```

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;
