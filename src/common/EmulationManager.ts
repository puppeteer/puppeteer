/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { CDPSession } from './Connection.js';
import { Viewport } from './PuppeteerViewport.js';
import { Protocol } from 'devtools-protocol';

export class EmulationManager {
  _client: CDPSession;
  _emulatingMobile = false;
  _hasTouch = false;

  constructor(client: CDPSession) {
    this._client = client;
  }

  async emulateViewport(viewport: Viewport): Promise<boolean> {
    const mobile = viewport.isMobile || false;
    const width = viewport.width;
    const height = viewport.height;
    const deviceScaleFactor = viewport.deviceScaleFactor || 1;
    const screenOrientation: Protocol.Emulation.ScreenOrientation =
      viewport.isLandscape
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

    const reloadNeeded =
      this._emulatingMobile !== mobile || this._hasTouch !== hasTouch;
    this._emulatingMobile = mobile;
    this._hasTouch = hasTouch;
    return reloadNeeded;
  }
}
