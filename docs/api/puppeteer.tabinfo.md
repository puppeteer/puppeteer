---
sidebar_label: TabInfo
---

# TabInfo interface

Information about the browser tab of a page. See [Page.tabInfo()](./puppeteer.page.tabinfo.md).

### Signature

```typescript
export interface TabInfo
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="active">active</span>

</td><td>

</td><td>

boolean

</td><td>

Whether the tab is the active tab in its window.

</td><td>

</td></tr>
<tr><td>

<span id="groupid">groupId</span>

</td><td>

`optional`

</td><td>

string

</td><td>

ID of the tab group the tab belongs to, if any.

</td><td>

</td></tr>
<tr><td>

<span id="index">index</span>

</td><td>

</td><td>

number

</td><td>

Zero-based index of the tab in its window's tab strip.

</td><td>

</td></tr>
<tr><td>

<span id="pinned">pinned</span>

</td><td>

</td><td>

boolean

</td><td>

Whether the tab is pinned.

</td><td>

</td></tr>
</tbody></table>
