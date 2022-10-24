---
sidebar_label: FileChooser.accept
---

# FileChooser.accept() method

Accept the file chooser request with given paths.

#### Signature:

```typescript
class FileChooser {
  accept(filePaths: string[]): Promise<void>;
}
```

## Parameters

| Parameter | Type       | Description                                                                                                                                                                            |
| --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| filePaths | string\[\] | If some of the <code>filePaths</code> are relative paths, then they are resolved relative to the [current working directory](https://nodejs.org/api/process.html#process_process_cwd). |

**Returns:**

Promise&lt;void&gt;
