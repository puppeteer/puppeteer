---
sidebar_label: Logger
---

# Logger type

A logger factory function that receives a debug channel prefix and returns a [LoggerFunction](./puppeteer.loggerfunction.md) to emit logs for that channel, or `undefined` if logging is disabled for that channel.

### Signature

```typescript
export type Logger = (prefix: string) => LoggerFunction | undefined;
```

**References:** [LoggerFunction](./puppeteer.loggerfunction.md)

## Example

```ts
const customLogger: Logger = (prefix: string) => {
  if (prefix.includes('protocol')) {
    return (...args: unknown[]) => console.log(`[DEBUG: ${prefix}]`, ...args);
  }
  return undefined;
};
```
