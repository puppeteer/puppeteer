---
sidebar_label: BrowserContext.setPermission
---

# BrowserContext.setPermission() method

Sets the permission for a specific origin.

### Signature

```typescript
class BrowserContext {
  abstract setPermission(
    origin: string | '*',
    ...permissions: Array<{
      permission: PermissionDescriptor;
      state: PermissionState;
    }>
  ): Promise<void>;
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

origin

</td><td>

string \| '\*'

</td><td>

The origin to set the permission for.

</td></tr>
<tr><td>

permissions

</td><td>

Array&lt;&#123; permission: [PermissionDescriptor](./puppeteer.permissiondescriptor_2.md); state: [PermissionState](./puppeteer.permissionstate_2.md); &#125;&gt;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
