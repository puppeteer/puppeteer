---
sidebar_label: install
---

# install() function

#### Signature:

```typescript
export declare function install(
  options: InstallOptions & {
    unpack?: true;
  }
): Promise<InstalledBrowser>;
```

## Parameters

| Parameter | Type                                                                    | Description |
| --------- | ----------------------------------------------------------------------- | ----------- |
| options   | [InstallOptions](./browsers.installoptions.md) &amp; \{ unpack?: true; \} |             |

**Returns:**

Promise&lt;[InstalledBrowser](./browsers.installedbrowser.md)&gt;
