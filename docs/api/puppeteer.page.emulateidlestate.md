---
sidebar_label: Page.emulateIdleState
---

# Page.emulateIdleState() method

Emulates the idle state. If no arguments set, clears idle state emulation.

#### Signature:

```typescript
class Page &#123;abstract emulateIdleState(overrides?: &#123;
        isUserActive: boolean;
        isScreenUnlocked: boolean;
    &#125;): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                            | Description                                                     |
| --------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| overrides | &#123; isUserActive: boolean; isScreenUnlocked: boolean; &#125; | _(Optional)_ Mock idle state. If not set, clears idle overrides |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
// set idle emulation
await page.emulateIdleState(&#123;isUserActive: true, isScreenUnlocked: false&#125;);

// do some checks here
...

// clear idle emulation
await page.emulateIdleState();
```
