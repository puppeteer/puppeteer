---
sidebar_label: install
---

# install() function

#### Signature:

```typescript
export declare function install(
  options: InstallOptions & {
    unpack?: true;
  }
): Promise<InstalledBrowser>;
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

[InstallOptions](./browsers.installoptions.md) &amp; &#123; unpack?: true; &#125;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[InstalledBrowser](./browsers.installedbrowser.md)&gt;

#### Signature:

```typescript
export declare function install(
  options: InstallOptions & {
    unpack: false;
  }
): Promise<string>;
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

[InstallOptions](./browsers.installoptions.md) &amp; &#123; unpack: false; &#125;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;string&gt;
