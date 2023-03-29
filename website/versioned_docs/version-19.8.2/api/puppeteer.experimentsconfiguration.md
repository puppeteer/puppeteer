---
sidebar_label: ExperimentsConfiguration
---

# ExperimentsConfiguration interface

Defines experiment options for Puppeteer.

See individual properties for more information.

#### Signature:

```typescript
export interface ExperimentsConfiguration
```

## Properties

| Property              | Modifiers             | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                      | Default            |
| --------------------- | --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| macArmChromiumEnabled | <code>optional</code> | boolean | <p>Require Puppeteer to download Chromium for Apple M1.</p><p>On Apple M1 devices Puppeteer by default downloads the version for Intel's processor which runs via Rosetta. It works without any problems, however, with this option, you should get more efficient resource usage (CPU and RAM) that could lead to a faster execution time.</p><p>Can be overridden by <code>PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM</code>.</p> | <code>false</code> |
