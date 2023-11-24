---
sidebar_label: PuppeteerNode.trimCache
---

# PuppeteerNode.trimCache() method

Removes all non-current Firefox and Chrome binaries in the cache directory identified by the provided Puppeteer configuration. The current browser version is determined by resolving PUPPETEER_REVISIONS from Puppeteer unless `configuration.browserRevision` is provided.

#### Signature:

```typescript
class PuppeteerNode &#123;trimCache(): Promise<void>;&#125;
```

**Returns:**

Promise&lt;void&gt;

## Remarks

Note that the method does not check if any other Puppeteer versions installed on the host that use the same cache directory require the non-current binaries.
