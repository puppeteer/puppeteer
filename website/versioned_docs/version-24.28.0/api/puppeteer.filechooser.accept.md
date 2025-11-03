---
sidebar_label: FileChooser.accept
---

# FileChooser.accept() method

Accept the file chooser request with the given file paths.

### Signature

```typescript
class FileChooser {
  accept(paths: string[]): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

paths

</td><td>

string\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

This will not validate whether the file paths exists. Also, if a path is relative, then it is resolved against the [current working directory](https://nodejs.org/api/process.html#process_process_cwd). For locals script connecting to remote chrome environments, paths must be absolute.
