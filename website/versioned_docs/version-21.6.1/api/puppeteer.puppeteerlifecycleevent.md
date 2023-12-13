---
sidebar_label: PuppeteerLifeCycleEvent
---

# PuppeteerLifeCycleEvent type

#### Signature:

```typescript
export type PuppeteerLifeCycleEvent =
  /**
   * Waits for the 'load' event.
   */
  | 'load'
  /**
   * Waits for the 'DOMContentLoaded' event.
   */
  | 'domcontentloaded'
  /**
   * Waits till there are no more than 0 network connections for at least `500`
   * ms.
   */
  | 'networkidle0'
  /**
   * Waits till there are no more than 2 network connections for at least `500`
   * ms.
   */
  | 'networkidle2';
```
