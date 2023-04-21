---
sidebar_label: ElementHandle.uploadFile
---

# ElementHandle.uploadFile() method

Sets the value of an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) to the given file paths.

#### Signature:

```typescript
class ElementHandle {
  uploadFile(
    this: ElementHandle<HTMLInputElement>,
    ...paths: string[]
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                  | Description |
| --------- | --------------------------------------------------------------------- | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLInputElement&gt; |             |
| paths     | string\[\]                                                            |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

This will not validate whether the file paths exists. Also, if a path is relative, then it is resolved against the [current working directory](https://nodejs.org/api/process.html#process_process_cwd). For locals script connecting to remote chrome environments, paths must be absolute.
