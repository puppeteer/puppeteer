---
sidebar_label: Page.goForward
---

# Page.goForward() method

This method navigate to the next page in history.

### Signature

```typescript
class Page {
  abstract goForward(options?: WaitForOptions): Promise<HTTPResponse | null>;
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

[WaitForOptions](./puppeteer.waitforoptions.md)

</td><td>

_(Optional)_ Navigation Parameter

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect. If the navigation is same page, returns null. If no history entry is found throws.
