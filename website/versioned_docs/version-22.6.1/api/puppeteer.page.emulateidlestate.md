---
sidebar_label: Page.emulateIdleState
---

# Page.emulateIdleState() method

Emulates the idle state. If no arguments set, clears idle state emulation.

#### Signature:

```typescript
class Page {
  abstract emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

overrides

</td><td>

&#123; isUserActive: boolean; isScreenUnlocked: boolean; &#125;

</td><td>

_(Optional)_ Mock idle state. If not set, clears idle overrides

</td></tr>
</tbody></table>
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
