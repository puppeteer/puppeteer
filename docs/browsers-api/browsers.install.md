---
sidebar_label: install
---

# install() function

<h2 id="overload-1">install(): Promise&lt;InstalledBrowser&gt;</h2>

Downloads and unpacks the browser archive according to the [InstallOptions](./browsers.installoptions.md).

### Signature

```typescript
export declare function install(
  options: InstallOptions & {
    unpack?: true;
  },
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

a [InstalledBrowser](./browsers.installedbrowser.md) instance.

<h2 id="overload-2">install(): Promise&lt;string&gt;</h2>

Downloads the browser archive according to the [InstallOptions](./browsers.installoptions.md) without unpacking.

### Signature

```typescript
export declare function install(
  options: InstallOptions & {
    unpack: false;
  },
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

the absolute path to the archive.
