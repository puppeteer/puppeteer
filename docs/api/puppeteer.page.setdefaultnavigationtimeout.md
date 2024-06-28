---
sidebar_label: Page.setDefaultNavigationTimeout
---

# Page.setDefaultNavigationTimeout() method

### Signature:

```typescript
class Page {
  abstract setDefaultNavigationTimeout(timeout: number): void;
}
```

This setting will change the default maximum navigation time for the following methods and related shortcuts:

- [page.goBack(options)](./puppeteer.page.goback.md)

- [page.goForward(options)](./puppeteer.page.goforward.md)

- [page.goto(url,options)](./puppeteer.page.goto.md)

- [page.reload(options)](./puppeteer.page.reload.md)

- [page.setContent(html,options)](./puppeteer.page.setcontent.md)

- [page.waitForNavigation(options)](./puppeteer.page.waitfornavigation.md)

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

timeout

</td><td>

number

</td><td>

Maximum navigation time in milliseconds.

</td></tr>
</tbody></table>
**Returns:**

void
