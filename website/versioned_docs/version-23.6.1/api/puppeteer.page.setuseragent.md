---
sidebar_label: Page.setUserAgent
---

# Page.setUserAgent() method

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
