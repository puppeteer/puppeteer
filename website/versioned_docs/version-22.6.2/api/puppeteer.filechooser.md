---
sidebar_label: FileChooser
---

# FileChooser class

File choosers let you react to the page requesting for a file.

#### Signature:

```typescript
export declare class FileChooser
```

## Remarks

`FileChooser` instances are returned via the [Page.waitForFileChooser()](./puppeteer.page.waitforfilechooser.md) method.

In browsers, only one file chooser can be opened at a time. All file choosers must be accepted or canceled. Not doing so will prevent subsequent file choosers from appearing.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `FileChooser` class.

## Example

```ts
const [fileChooser] = await Promise.all([
  page.waitForFileChooser(),
  page.click('#upload-file-button'), // some button that triggers file selection
]);
await fileChooser.accept(['/tmp/myfile.pdf']);
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[accept(paths)](./puppeteer.filechooser.accept.md)

</td><td>

</td><td>

Accept the file chooser request with the given file paths.

</td></tr>
<tr><td>

[cancel()](./puppeteer.filechooser.cancel.md)

</td><td>

</td><td>

Closes the file chooser without selecting any files.

</td></tr>
<tr><td>

[isMultiple()](./puppeteer.filechooser.ismultiple.md)

</td><td>

</td><td>

Whether file chooser allow for [multiple](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-multiple) file selection.

</td></tr>
</tbody></table>
