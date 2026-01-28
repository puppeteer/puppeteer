---
sidebar_label: BrowserContext.setPermission
---

# BrowserContext.setPermission() method

Sets the permission for a specific origin.

### Signature

```typescript
class BrowserContext {
  abstract setPermission(
    origin: string,
    permission: PermissionDescriptor,
    state: PermissionState,
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

string

</td><td>

The origin to set the permission for.

</td></tr>
<tr><td>

permission

</td><td>

[PermissionDescriptor](./puppeteer.permissiondescriptor_2.md)

</td><td>

The permission descriptor.

</td></tr>
<tr><td>

state

</td><td>

[PermissionState](./puppeteer.permissionstate_2.md)

</td><td>

The state of the permission.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
