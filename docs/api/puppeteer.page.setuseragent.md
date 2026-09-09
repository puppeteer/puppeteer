---
sidebar_label: Page.setUserAgent
---

# Page.setUserAgent() method

<h2 id="overload-1">setUserAgent(): Promise&lt;void&gt;</h2>

> Warning: This API is now obsolete.
>
> Use [Page.setUserAgent()](./puppeteer.page.setuseragent.md#overload-2) instead.

### Signature

```typescript
class Page {
  abstract setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata,
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

userAgent

</td><td>

string

</td><td>

Specific user agent to use in this page

</td></tr>
<tr><td>

userAgentMetadata

</td><td>

Protocol.Emulation.UserAgentMetadata

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the user agent is set.

<h2 id="overload-2">setUserAgent(): Promise&lt;void&gt;</h2>

### Signature

```typescript
class Page {
  abstract setUserAgent(options: {
    userAgent?: string;
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata;
    platform?: string;
  }): Promise<void>;
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

&#123; userAgent?: string; userAgentMetadata?: Protocol.Emulation.UserAgentMetadata; platform?: string; &#125;

</td><td>

Object containing user agent and optional user agent metadata

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the user agent is set.
