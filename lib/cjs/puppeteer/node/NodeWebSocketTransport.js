"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeWebSocketTransport = void 0;
const ws_1 = __importDefault(require("ws"));
class NodeWebSocketTransport {
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
            const ws = new ws_1.default(url, [], {
                perMessageDeflate: false,
                maxPayload: 256 * 1024 * 1024, // 256Mb
            });
            ws.addEventListener('open', () => resolve(new NodeWebSocketTransport(ws)));
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
exports.NodeWebSocketTransport = NodeWebSocketTransport;
//# sourceMappingURL=NodeWebSocketTransport.js.map