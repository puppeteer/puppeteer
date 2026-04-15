---
sidebar_label: WebMCPTool
---

# WebMCPTool class

Represents a registered WebMCP tool available on the page.

### Signature

```typescript
export declare class WebMCPTool extends EventEmitter<{
    toolinvoked: WebMCPToolCall;
}>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;&#123; toolinvoked: [WebMCPToolCall](./puppeteer.webmcptoolcall.md); &#125;&gt;

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `WebMCPTool` class.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="annotations">annotations</span>

</td><td>

`optional`

</td><td>

[WebMCPAnnotation](./puppeteer.webmcpannotation.md)

</td><td>

Optional annotations for the tool.

</td></tr>
<tr><td>

<span id="description">description</span>

</td><td>

</td><td>

string

</td><td>

Tool description.

</td></tr>
<tr><td>

<span id="formelement">formElement</span>

</td><td>

`readonly`

</td><td>

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLFormElement&gt; \| undefined&gt;

</td><td>

The corresponding ElementHandle when tool was registered via a form.

</td></tr>
<tr><td>

<span id="frame">frame</span>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

Frame the tool was defined for.

</td></tr>
<tr><td>

<span id="inputschema">inputSchema</span>

</td><td>

`optional`

</td><td>

object

</td><td>

Schema for the tool's input parameters.

</td></tr>
<tr><td>

<span id="location">location</span>

</td><td>

`optional`

</td><td>

[ConsoleMessageLocation](./puppeteer.consolemessagelocation.md)

</td><td>

Source location that defined the tool (if available).

</td></tr>
<tr><td>

<span id="name">name</span>

</td><td>

</td><td>

string

</td><td>

Tool name.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="execute">[execute(input)](./puppeteer.webmcptool.execute.md)</span>

</td><td>

</td><td>

Executes tool with input parameters, matching tool's `inputSchema`.

</td></tr>
</tbody></table>
