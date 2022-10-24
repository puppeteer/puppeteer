---
sidebar_label: Configuration.browserRevision
---

# Configuration.browserRevision property

Specifies a certain version of the browser you'd like Puppeteer to use.

Can be overridden by `PUPPETEER_BROWSER_REVISION`.

See [puppeteer.launch](./puppeteer.puppeteernode.launch.md) on how executable path is inferred.

#### Signature:

```typescript
interface Configuration {
  browserRevision?: string;
}
```

#### Default value:

A compatible-revision of the browser.
