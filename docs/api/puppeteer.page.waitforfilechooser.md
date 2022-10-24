---
sidebar_label: Page.waitForFileChooser
---

# Page.waitForFileChooser() method

This method is typically coupled with an action that triggers file choosing.

:::caution

This must be called before the file chooser is launched. It will not return a currently active file chooser.

:::

#### Signature:

```typescript
class Page {
  waitForFileChooser(options?: WaitTimeoutOptions): Promise<FileChooser>;
}
```

## Parameters

| Parameter | Type                                                    | Description       |
| --------- | ------------------------------------------------------- | ----------------- |
| options   | [WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md) | <i>(Optional)</i> |

**Returns:**

Promise&lt;[FileChooser](./puppeteer.filechooser.md)&gt;

## Remarks

In non-headless Chromium, this method results in the native file picker dialog `not showing up` for the user.

## Example

The following example clicks a button that issues a file chooser and then responds with `/tmp/myfile.pdf` as if a user has selected this file.

```ts
const [fileChooser] = await Promise.all([
  page.waitForFileChooser(),
  page.click('#upload-file-button'),
  // some button that triggers file selection
]);
await fileChooser.accept(['/tmp/myfile.pdf']);
```
