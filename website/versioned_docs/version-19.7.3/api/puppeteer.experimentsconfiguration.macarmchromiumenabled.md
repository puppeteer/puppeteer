---
sidebar_label: ExperimentsConfiguration.macArmChromiumEnabled
---

# ExperimentsConfiguration.macArmChromiumEnabled property

Require Puppeteer to download Chromium for Apple M1.

On Apple M1 devices Puppeteer by default downloads the version for Intel's processor which runs via Rosetta. It works without any problems, however, with this option, you should get more efficient resource usage (CPU and RAM) that could lead to a faster execution time.

Can be overridden by `PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM`.

#### Signature:

```typescript
interface ExperimentsConfiguration {
  macArmChromiumEnabled?: boolean;
}
```

#### Default value:

`false`
