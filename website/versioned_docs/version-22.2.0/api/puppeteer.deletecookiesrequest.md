---
sidebar_label: DeleteCookiesRequest
---

# DeleteCookiesRequest interface

#### Signature:

```typescript
export interface DeleteCookiesRequest
```

## Properties

| Property | Modifiers             | Type   | Description                                                                                         | Default |
| -------- | --------------------- | ------ | --------------------------------------------------------------------------------------------------- | ------- |
| domain   | <code>optional</code> | string | If specified, deletes only cookies with the exact domain.                                           |         |
| name     |                       | string | Name of the cookies to remove.                                                                      |         |
| path     | <code>optional</code> | string | If specified, deletes only cookies with the exact path.                                             |         |
| url      | <code>optional</code> | string | If specified, deletes all the cookies with the given name where domain and path match provided URL. |         |
