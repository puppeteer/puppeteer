# The DevTools Protocol

The DevTools Protocol is the main API that Chromium exposes to external programs in order to debug and automate the browser.
As of April 2019, it consists of 440 commands ranging from evaluating JavaScript to casting a tab to a remote playback device.
While all of these commands use the same basic JSON format and transport, they have very different levels of stability.

## Very Stable: Core JavaScript Debugging API
The core javascript debugging experience consists of the `Runtime.` and `Debugger.` domains. It provides the ability
to evaluate JavaScript and set breakpoints. This API lives in V8, and is supported by NodeJS. A very similar version of
this API is in WebKit's JavaScriptCore, and Microsoft's ChakraCore. This API is tied to the NodeJS LTS release cycle.

The DevTools frontend (and most other debugging tools like VSCode) work with any version of this API
in any currently supported version of NodeJS.

## Somewhat Stable: Core Browser Debugging API
This consists of the `DOM.`, `Page.`, `CSS.` and some parts of the `Network.` domain. This API changes at roughly
the same speed that the Web Platform changes. Generally speaking, a new feature is added to Chromium and then
the DevTools team adds a new method to the protocol to debug it. New methods are added all of the time to
these domains, but the old ones mostly stay around forever. Most of this api is marked `stable` and
will not be changed.

The DevTools frontend does NOT support old versions of this API. In order to debug older versions of
this api (for example, on an older Android device), we download and use the version of the
DevTools frontend that corresponds to that older version of the DevTools protocol.

## Very Unstable: Targets, Automation, Emulation, Deep Inpsection API
This consists of everything else, and is mostly marked `experimental`. It changes as fast as we
can change it. New features are constantly being added, removed, or refactored. Some parts
of it are used by the DevTools frontend, but most of it was written for internal chromium
products, webdriver functionality, headless features, experimental web platform features,
etc.


# Puppeteer API
The Puppeteer API is the most stable of all of these APIs. Methods in puppeteer
are gauranteed not to break in api or functionality.

Puppeteer uses all parts of the protocol, regardless of their stability. We view
the (unstable) protocol as an internal implementation detail of Puppeteer. Conversely
Puppeteer is the public API to the unstable parts of the protocol. When the protocol
changes, we make the equivalent change to Puppeteer to keep it working. This
is why every version of puppeteer is tied to a specific version of Chromium.
Puppeteer is neither backwards nor fowards compatibility with Chromium.

When we add a new method to the Puppeteer JS API, it is a gaurantee that
that functionality will stick around in Chromium in some form. It is NOT
a gaurantee that the protocol methods for that functionality will remain unchanged.