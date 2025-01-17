---
sidebar_label: SupportedWebDriverCapability
---

# SupportedWebDriverCapability type

### Signature

```typescript
export declare type SupportedWebDriverCapability = Exclude<
  Session.CapabilityRequest,
  'unhandledPromptBehavior' | 'acceptInsecureCerts'
>;
```
