---
sidebar_label: LaunchOptions
---

# LaunchOptions interface

### Signature

```typescript
export interface LaunchOptions
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

<span id="args">args</span>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

Additional arguments to pass to the executable when launching.

</td><td>

</td></tr>
<tr><td>

<span id="detached">detached</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to spawn process in the [detached](https://nodejs.org/api/child_process.html#optionsdetached) mode.

</td><td>

`true` except on Windows.

</td></tr>
<tr><td>

<span id="dumpio">dumpio</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

If true, forwards the browser's process stdout and stderr to the Node's process stdout and stderr.

</td><td>

`false`.

</td></tr>
<tr><td>

<span id="env">env</span>

</td><td>

`optional`

</td><td>

Record&lt;string, string \| undefined&gt;

</td><td>

Environment variables to set for the browser process.

</td><td>

</td></tr>
<tr><td>

<span id="executablepath">executablePath</span>

</td><td>

</td><td>

string

</td><td>

Absolute path to the browser's executable.

</td><td>

</td></tr>
<tr><td>

<span id="handlesighup">handleSIGHUP</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Handles SIGHUP in the Node process and tries to gracefully close the browser process.

</td><td>

`true`.

</td></tr>
<tr><td>

<span id="handlesigint">handleSIGINT</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Handles SIGINT in the Node process and tries to kill the browser process.

</td><td>

`true`.

</td></tr>
<tr><td>

<span id="handlesigterm">handleSIGTERM</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Handles SIGTERM in the Node process and tries to gracefully close the browser process.

</td><td>

`true`.

</td></tr>
<tr><td>

<span id="onexit">onExit</span>

</td><td>

`optional`

</td><td>

() =&gt; Promise&lt;void&gt;

</td><td>

A callback to run after the browser process exits or before the process will be closed via the [Process.close()](./browsers.process.close.md) call (including when handling signals). The callback is only run once.

</td><td>

</td></tr>
<tr><td>

<span id="pipe">pipe</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Configures stdio streams to open two additional streams for automation over those streams instead of WebSocket.

</td><td>

`false`.

</td></tr>
</tbody></table>
