---
sidebar_label: Configuration.temporaryDirectory
---

# Configuration.temporaryDirectory property

Defines the directory to be used by Puppeteer for creating temporary files.

Can be overridden by `PUPPETEER_TMP_DIR`.

#### Signature:

```typescript
interface Configuration {
  temporaryDirectory?: string;
}
```

#### Default value:

`os.tmpdir()`
