---
sidebar_label: PuppeteerNode.executablePath
---

# PuppeteerNode.executablePath() method

<h2 id="overload-1">executablePath(): Promise&lt;string&gt;</h2>

The default executable path for a given ChromeReleaseChannel.

### Signature

```typescript
class PuppeteerNode {
  executablePath(channel: ChromeReleaseChannel): Promise<string>;
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

channel

</td><td>

[ChromeReleaseChannel](./puppeteer.chromereleasechannel.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt;

<h2 id="overload-2">executablePath(): Promise&lt;string&gt;</h2>

The default executable path given LaunchOptions.

### Signature

```typescript
class PuppeteerNode {
  executablePath(options: LaunchOptions): Promise<string>;
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

options

</td><td>

[LaunchOptions](./puppeteer.launchoptions.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt;

<h2 id="overload-3">executablePath(): Promise&lt;string&gt;</h2>

The default executable path.

### Signature

```typescript
class PuppeteerNode {
  executablePath(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;
