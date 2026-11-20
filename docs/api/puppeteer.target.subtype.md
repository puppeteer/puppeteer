---
sidebar_label: Target.subtype
---

# Target.subtype() method

Returns the subtype of the target, as CDP reports it. For example, a prerendered page has the subtype `"prerender"`. Returns `undefined` if the target has no subtype.

### Signature

```typescript
class Target {
  subtype(): string | undefined;
}
```

**Returns:**

string \| undefined

## Remarks

Only supported for Chrome and the CDP protocol. With WebDriver BiDi, returns `undefined`.
