# Diagnostics Report: Lighthouse Session Timeouts

During Lighthouse audits, a recurring timeout error occurs:
```
Error: Network.emulateNetworkConditions timed out. Increase the 'protocolTimeout' setting in launch/connect calls for a higher timeout if needed.
```

An in-depth analysis of the CDP (Chrome DevTools Protocol) logs in `log.txt` has revealed a **critical routing bug** in the core Puppeteer message dispatching mechanism. This bug causes commands sent to invalid/detached sessions to hang indefinitely instead of failing immediately with a proper protocol error.

---

## CDP Log Lifecycles

By tracing the messages in `log.txt`, we can observe the exact sequence of events that leads to the timeout:

### 1. Broad Network Emulation Application
At timestamp `11:44:47.700Z`, the Lighthouse audit triggers `Network.emulateNetworkConditions` across all registered sessions concurrently (including pages, frames, and workers):
*   **Command 608** (Session `51B8F974A5DAF077E955D16F60EEF870`):
    ```json
    {"method":"Network.emulateNetworkConditions","params":{"offline":false,"latency":0,"uploadThroughput":-1,"downloadThroughput":-1},"id":608,"sessionId":"51B8F974A5DAF077E955D16F60EEF870"}
    ```
*   **Command 609** (Session `D0CF2B89C1CB6032FF12EB1732862BCF`):
    ```json
    {"method":"Network.emulateNetworkConditions","params":{"offline":false,"latency":0,"uploadThroughput":-1,"downloadThroughput":-1},"id":609,"sessionId":"D0CF2B89C1CB6032FF12EB1732862BCF"}
    ```
*   **Command 610** (Session `5670CD89A7BC76376E6314E9C753D75A`):
    ```json
    {"method":"Network.emulateNetworkConditions","params":{"offline":false,"latency":0,"uploadThroughput":-1,"downloadThroughput":-1},"id":610,"sessionId":"5670CD89A7BC76376E6314E9C753D75A"}
    ```
*   **Command 611** (Session `50C904A31CD6873E0883D005B275C87C`):
    ```json
    {"method":"Network.emulateNetworkConditions","params":{"offline":false,"latency":0,"uploadThroughput":-1,"downloadThroughput":-1},"id":611,"sessionId":"50C904A31CD6873E0883D005B275C87C"}
    ```

### 2. Chrome's Response Handling
At timestamp `11:44:47.727Z` (27ms later), Chrome sends back the responses for all four commands:
*   **Command 608 Success**:
    ```json
    {"id":608,"result":{},"sessionId":"51B8F974A5DAF077E955D16F60EEF870"}
    ```
*   **Command 610 Success**:
    ```json
    {"id":610,"result":{},"sessionId":"5670CD89A7BC76376E6314E9C753D75A"}
    ```
*   **Command 611 Not Supported Error**:
    ```json
    {"id":611,"error":{"code":-32000,"message":"Not supported"},"sessionId":"50C904A31CD6873E0883D005B275C87C"}
    ```
*   **Command 609 Session Not Found Error**:
    ```json
    {"id":609,"error":{"code":-32001,"message":"Session with given id not found."}}
    ```

> [!IMPORTANT]
> Observe the response for **Command 609**: Unlike the other three responses, it does **not** contain a `sessionId` attribute. Because Chrome could not find the session ID specified in the request, it treats the request as belonging to the root connection and does not include the invalid `sessionId` in the error payload.

---

## The Root Cause: Puppeteer Callback Routing Bug

Puppeteer handles incoming CDP messages in `Connection.onMessage(message)` as follows:

```javascript
async onMessage(message) {
    const object = JSON.parse(message);
    
    if (object.sessionId) {
        // Route message to the specific target session
        const session = this.#sessions.get(object.sessionId);
        if (session) {
            session.onMessage(object);
        }
    }
    else if (object.id) {
        // Route message to the root connection's CallbackRegistry
        if (object.error) {
            this.#callbacks.reject(object.id, createProtocolErrorMessage(object), object.error.message);
        } else {
            this.#callbacks.resolve(object.id, object.result);
        }
    }
}
```

### The Bug Scenario
1. When a session-specific command (like `Network.emulateNetworkConditions` on session `D0CF2B89C1CB6032FF12EB1732862BCF`) is sent:
   * The callback is registered on the **`CDPSession`'s local `CallbackRegistry`** (`session.#callbacks`).
   * The global `id` (e.g., `609`) is allocated from the shared `connection._idGenerator`.
2. When the error `Session with given id not found.` is received, it does **not** have `object.sessionId`.
3. Puppeteer's `Connection.onMessage` matches `else if (object.id)`.
4. It attempts to resolve/reject the callback `609` on the **root `Connection`'s `CallbackRegistry`** (`this.#callbacks`).
5. Because `id: 609` was never registered in the root connection's registry (it is in the `CDPSession`'s registry), the action is a no-op, and **the callback is completely ignored**.
6. The promise returned by `CDPSession.send()` for command `609` remains **permanently pending**.
7. Eventually, the protocol timeout is reached, causing the audit to crash with the timeout exception.

This same failure mode is observed again later in the logs:
*   **Command 612** (`Runtime.runIfWaitingForDebugger` sent to worker session `67920C8AC6A9D97029136B6862F1EB5C`):
    ```json
    {"method":"Runtime.runIfWaitingForDebugger","params":{"timeout":30050},"id":612,"sessionId":"67920C8AC6A9D97029136B6862F1EB5C"}
    ```
*   Chrome's response returns:
    ```json
    {"id":612,"error":{"code":-32001,"message":"Session with given id not found."}}
    ```
    Again, missing the `sessionId` field, causing the worker session command to hang indefinitely.

---

## Recommendations for Remediation

To address this issue, we can implement a multi-layered fix:

### 1. Filter Target Sessions before Network Emulation
Before applying network emulation or other `Network` domain commands during the Lighthouse lifecycle in [lighthouse.ts](file:///usr/local/google/home/wolfi/dev/mcp/chrome-devtools-mcp/src/tools/lighthouse.ts), only target active, page-type sessions. Avoid executing configuration commands on frame/worker sessions that may have detached or do not support these properties.

### 2. Wrap CDP Calls in `try/catch`
Since session detachments can occur concurrently, all CDP session interactions in tool handlers should be robustly wrapped in try-catch logic to handle any protocol/timeout errors gracefully, preventing the entire audit from failing.

### 3. Puppeteer Patch / Upstream Bug Fix
In Puppeteer's routing logic, if a command `id` is received that is not found in the root connection's `CallbackRegistry`, the connection should search its active `sessions` to locate which session registered that `id`, and route the rejection/resolution accordingly.
