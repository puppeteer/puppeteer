---
sidebar_label: PuppeteerNode.executablePath
---

# PuppeteerNode.executablePath() method

**Signature:**

```typescript
class PuppeteerNode {
  executablePath(channel?: string): string;
}
```

## Parameters

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| channel   | string | <i>(Optional)</i> |

**Returns:**

string

A path where Puppeteer expects to find the bundled browser. The browser binary might not be there if the download was skipped with the `PUPPETEER_SKIP_DOWNLOAD` environment variable.

## Remarks

\*\*NOTE\*\* `puppeteer.executablePath()` is affected by the `PUPPETEER_EXECUTABLE_PATH` and `PUPPETEER_CHROMIUM_REVISION` environment variables.
