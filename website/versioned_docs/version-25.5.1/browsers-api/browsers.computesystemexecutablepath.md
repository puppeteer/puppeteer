---
sidebar_label: computeSystemExecutablePath
---

# computeSystemExecutablePath() function

Returns a path to a system-wide Chrome installation given a release channel name by checking known installation locations (using [https://pptr.dev/browsers-api/browsers.computesystemexecutablepath](https://pptr.dev/browsers-api/browsers.computesystemexecutablepath)). If Chrome instance is not found at the expected path, an error is thrown.

### Signature

```typescript
export declare function computeSystemExecutablePath(
  options: SystemOptions,
): string;
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

options

</td><td>

[SystemOptions](./browsers.systemoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

string
