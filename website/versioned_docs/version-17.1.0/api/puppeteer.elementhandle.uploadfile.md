---
sidebar_label: ElementHandle.uploadFile
---

# ElementHandle.uploadFile() method

This method expects `elementHandle` to point to an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input).

**Signature:**

```typescript
class ElementHandle {
  uploadFile(
    this: ElementHandle<HTMLInputElement>,
    ...filePaths: string[]
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                  | Description                                                                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLInputElement&gt; |                                                                                                                                                                                                                                                                                        |
| filePaths | string\[\]                                                            | Sets the value of the file input to these paths. If a path is relative, then it is resolved against the [current working directory](https://nodejs.org/api/process.html#process_process_cwd). Note for locals script connecting to remote chrome environments, paths must be absolute. |

**Returns:**

Promise&lt;void&gt;
