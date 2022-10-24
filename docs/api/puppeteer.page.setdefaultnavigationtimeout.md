---
sidebar_label: Page.setDefaultNavigationTimeout
---

# Page.setDefaultNavigationTimeout() method

This setting will change the default maximum navigation time for the following methods and related shortcuts:

- [page.goBack(options)](./puppeteer.page.goback.md)

- [page.goForward(options)](./puppeteer.page.goforward.md)

- [page.goto(url,options)](./puppeteer.page.goto.md)

- [page.reload(options)](./puppeteer.page.reload.md)

- [page.setContent(html,options)](./puppeteer.page.setcontent.md)

- [page.waitForNavigation(options)](./puppeteer.page.waitfornavigation.md)

#### Signature:

```typescript
class Page {
  setDefaultNavigationTimeout(timeout: number): void;
}
```

## Parameters

| Parameter | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| timeout   | number | Maximum navigation time in milliseconds. |

**Returns:**

void
