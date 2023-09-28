---
sidebar_label: Page.emulateIdleState
---

# Page.emulateIdleState() method

Emulates the idle state. If no arguments set, clears idle state emulation.

#### Signature:

```typescript
class Page {
  emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                  | Description                                                     |
| --------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| overrides | { isUserActive: boolean; isScreenUnlocked: boolean; } | _(Optional)_ Mock idle state. If not set, clears idle overrides |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
// set idle emulation
await page.emulateIdleState({isUserActive: true, isScreenUnlocked: false});

// do some checks here
...

// clear idle emulation
await page.emulateIdleState();
```
