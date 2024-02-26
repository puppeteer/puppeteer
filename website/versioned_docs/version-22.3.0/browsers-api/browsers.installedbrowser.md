---
sidebar_label: InstalledBrowser
---

# InstalledBrowser class

#### Signature:

```typescript
export declare class InstalledBrowser
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `InstalledBrowser` class.

## Properties

| Property       | Modifiers             | Type                                             | Description                                                                                                                                               |
| -------------- | --------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| browser        |                       | [Browser](./browsers.browser.md)                 |                                                                                                                                                           |
| buildId        |                       | string                                           |                                                                                                                                                           |
| executablePath | <code>readonly</code> | string                                           |                                                                                                                                                           |
| path           | <code>readonly</code> | string                                           | Path to the root of the installation folder. Use [computeExecutablePath()](./browsers.computeexecutablepath.md) to get the path to the executable binary. |
| platform       |                       | [BrowserPlatform](./browsers.browserplatform.md) |                                                                                                                                                           |

## Methods

| Method                                                                  | Modifiers | Description |
| ----------------------------------------------------------------------- | --------- | ----------- |
| [readMetadata()](./browsers.installedbrowser.readmetadata.md)           |           |             |
| [writeMetadata(metadata)](./browsers.installedbrowser.writemetadata.md) |           |             |
