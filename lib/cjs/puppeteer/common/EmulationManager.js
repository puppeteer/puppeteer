"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmulationManager = void 0;
class EmulationManager {
    constructor(client) {
        this._emulatingMobile = false;
        this._hasTouch = false;
        this._client = client;
    }
    async emulateViewport(viewport) {
        const mobile = viewport.isMobile || false;
        const width = viewport.width;
        const height = viewport.height;
        const deviceScaleFactor = viewport.deviceScaleFactor || 1;
        const screenOrientation = viewport.isLandscape
            ? { angle: 90, type: 'landscapePrimary' }
            : { angle: 0, type: 'portraitPrimary' };
        const hasTouch = viewport.hasTouch || false;
        await Promise.all([
            this._client.send('Emulation.setDeviceMetricsOverride', {
                mobile,
                width,
                height,
                deviceScaleFactor,
                screenOrientation,
            }),
            this._client.send('Emulation.setTouchEmulationEnabled', {
                enabled: hasTouch,
            }),
        ]);
        const reloadNeeded = this._emulatingMobile !== mobile || this._hasTouch !== hasTouch;
        this._emulatingMobile = mobile;
        this._hasTouch = hasTouch;
        return reloadNeeded;
    }
}
exports.EmulationManager = EmulationManager;
//# sourceMappingURL=EmulationManager.js.map