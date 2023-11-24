---
sidebar_label: Page.setBypassCSP
---

# Page.setBypassCSP() method

Toggles bypassing page's Content-Security-Policy.

#### Signature:

```typescript
class Page &#123;abstract setBypassCSP(enabled: boolean): Promise<void>;&#125;
```

## Parameters

| Parameter | Type    | Description                                       |
| --------- | ------- | ------------------------------------------------- |
| enabled   | boolean | sets bypassing of page's Content-Security-Policy. |

**Returns:**

Promise&lt;void&gt;

## Remarks

NOTE: CSP bypassing happens at the moment of CSP initialization rather than evaluation. Usually, this means that `page.setBypassCSP` should be called before navigating to the domain.
