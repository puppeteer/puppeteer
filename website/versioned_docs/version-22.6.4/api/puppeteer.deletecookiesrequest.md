---
sidebar_label: DeleteCookiesRequest
---

# DeleteCookiesRequest interface

#### Signature:

```typescript
export interface DeleteCookiesRequest
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

<span id="domain">domain</span>

</td><td>

`optional`

</td><td>

string

</td><td>

If specified, deletes only cookies with the exact domain.

</td><td>

</td></tr>
<tr><td>

<span id="name">name</span>

</td><td>

</td><td>

string

</td><td>

Name of the cookies to remove.

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

string

</td><td>

If specified, deletes only cookies with the exact path.

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

If specified, deletes all the cookies with the given name where domain and path match provided URL. Otherwise, deletes only cookies related to the current page's domain.

</td><td>

</td></tr>
</tbody></table>
