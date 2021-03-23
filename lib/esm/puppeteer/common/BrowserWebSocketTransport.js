export class BrowserWebSocketTransport {
    constructor(ws) {
        this._ws = ws;
        this._ws.addEventListener('message', (event) => {
            if (this.onmessage)
                this.onmessage.call(null, event.data);
        });
        this._ws.addEventListener('close', () => {
            if (this.onclose)
                this.onclose.call(null);
        });
        // Silently ignore all errors - we don't know what to do with them.
        this._ws.addEventListener('error', () => { });
        this.onmessage = null;
        this.onclose = null;
    }
    static create(url) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            ws.addEventListener('open', () => resolve(new BrowserWebSocketTransport(ws)));
            ws.addEventListener('error', reject);
        });
    }
    send(message) {
        this._ws.send(message);
    }
    close() {
        this._ws.close();
    }
}
//# sourceMappingURL=BrowserWebSocketTransport.js.map