---
sidebar_label: Configuration.cacheDirectory
---

# Configuration.cacheDirectory property

Defines the directory to be used by Puppeteer for caching.

Can be overridden by `PUPPETEER_CACHE_DIR`.

#### Signature:

```typescript
interface Configuration {
  cacheDirectory?: string;
}
```

#### Default value:

`path.join(os.homedir(), '.cache', 'puppeteer')`
