---
sidebar_label: errors
---

# errors variable

Puppeteer methods might throw errors if they are unable to fulfill a request. For example, `page.waitForSelector(selector[, options])` might fail if the selector doesn't match any nodes during the given timeframe.

For certain types of errors Puppeteer uses specific error classes. These classes are available via `puppeteer.errors`.

**Signature:**

```typescript
errors: PuppeteerErrors;
```

## Example

An example of handling a timeout error:

```ts
try {
  await page.waitForSelector('.foo');
} catch (e) {
  if (e instanceof puppeteer.errors.TimeoutError) {
    // Do something if this is a timeout.
  }
}
```
