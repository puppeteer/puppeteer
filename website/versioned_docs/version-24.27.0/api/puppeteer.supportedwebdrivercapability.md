---
sidebar_label: SupportedWebDriverCapability
---

# SupportedWebDriverCapability type

### Signature

```typescript
export type SupportedWebDriverCapability = Exclude<
  Session.CapabilityRequest,
  'unhandledPromptBehavior' | 'acceptInsecureCerts'
>;
```
