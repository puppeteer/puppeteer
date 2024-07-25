---
sidebar_label: Page.setBypassServiceWorker
---

# Page.setBypassServiceWorker() method

Toggles ignoring of service worker for each request.

### Signature

```typescript
class Page {
  abstract setBypassServiceWorker(bypass: boolean): Promise<void>;
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

bypass

</td><td>

boolean

</td><td>

Whether to bypass service worker and load from network.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
