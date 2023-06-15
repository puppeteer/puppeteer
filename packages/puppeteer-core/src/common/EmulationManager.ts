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
import {Protocol} from 'devtools-protocol';

import {GeolocationOptions, MediaFeature} from '../api/Page.js';
import {assert} from '../util/assert.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {CDPSession} from './Connection.js';
import {Viewport} from './PuppeteerViewport.js';

/**
 * @internal
 */
export class EmulationManager {
  #client: CDPSession;
  #emulatingMobile = false;
  #hasTouch = false;
  #javascriptEnabled = true;

  constructor(client: CDPSession) {
    this.#client = client;
  }

  get javascriptEnabled(): boolean {
    return this.#javascriptEnabled;
  }

  async emulateViewport(viewport: Viewport): Promise<boolean> {
    const mobile = viewport.isMobile || false;
    const width = viewport.width;
    const height = viewport.height;
    const deviceScaleFactor = viewport.deviceScaleFactor ?? 1;
    const screenOrientation: Protocol.Emulation.ScreenOrientation =
      viewport.isLandscape
        ? {angle: 90, type: 'landscapePrimary'}
        : {angle: 0, type: 'portraitPrimary'};
    const hasTouch = viewport.hasTouch || false;

    await Promise.all([
      this.#client.send('Emulation.setDeviceMetricsOverride', {
        mobile,
        width,
        height,
        deviceScaleFactor,
        screenOrientation,
      }),
      this.#client.send('Emulation.setTouchEmulationEnabled', {
        enabled: hasTouch,
      }),
    ]);

    const reloadNeeded =
      this.#emulatingMobile !== mobile || this.#hasTouch !== hasTouch;
    this.#emulatingMobile = mobile;
    this.#hasTouch = hasTouch;
    return reloadNeeded;
  }

  async emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void> {
    if (overrides) {
      await this.#client.send('Emulation.setIdleOverride', {
        isUserActive: overrides.isUserActive,
        isScreenUnlocked: overrides.isScreenUnlocked,
      });
    } else {
      await this.#client.send('Emulation.clearIdleOverride');
    }
  }

  async emulateTimezone(timezoneId?: string): Promise<void> {
    try {
      await this.#client.send('Emulation.setTimezoneOverride', {
        timezoneId: timezoneId || '',
      });
    } catch (error) {
      if (isErrorLike(error) && error.message.includes('Invalid timezone')) {
        throw new Error(`Invalid timezone ID: ${timezoneId}`);
      }
      throw error;
    }
  }

  async emulateVisionDeficiency(
    type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
  ): Promise<void> {
    const visionDeficiencies = new Set<
      Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
    >([
      'none',
      'achromatopsia',
      'blurredVision',
      'deuteranopia',
      'protanopia',
      'tritanopia',
    ]);
    try {
      assert(
        !type || visionDeficiencies.has(type),
        `Unsupported vision deficiency: ${type}`
      );
      await this.#client.send('Emulation.setEmulatedVisionDeficiency', {
        type: type || 'none',
      });
    } catch (error) {
      throw error;
    }
  }

  async emulateCPUThrottling(factor: number | null): Promise<void> {
    assert(
      factor === null || factor >= 1,
      'Throttling rate should be greater or equal to 1'
    );
    await this.#client.send('Emulation.setCPUThrottlingRate', {
      rate: factor ?? 1,
    });
  }

  async emulateMediaFeatures(features?: MediaFeature[]): Promise<void> {
    if (!features) {
      await this.#client.send('Emulation.setEmulatedMedia', {});
    }
    if (Array.isArray(features)) {
      for (const mediaFeature of features) {
        const name = mediaFeature.name;
        assert(
          /^(?:prefers-(?:color-scheme|reduced-motion)|color-gamut)$/.test(
            name
          ),
          'Unsupported media feature: ' + name
        );
      }
      await this.#client.send('Emulation.setEmulatedMedia', {
        features: features,
      });
    }
  }

  async emulateMediaType(type?: string): Promise<void> {
    assert(
      type === 'screen' ||
        type === 'print' ||
        (type ?? undefined) === undefined,
      'Unsupported media type: ' + type
    );
    await this.#client.send('Emulation.setEmulatedMedia', {
      media: type || '',
    });
  }

  async setGeolocation(options: GeolocationOptions): Promise<void> {
    const {longitude, latitude, accuracy = 0} = options;
    if (longitude < -180 || longitude > 180) {
      throw new Error(
        `Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`
      );
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error(
        `Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`
      );
    }
    if (accuracy < 0) {
      throw new Error(
        `Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`
      );
    }
    await this.#client.send('Emulation.setGeolocationOverride', {
      longitude,
      latitude,
      accuracy,
    });
  }

  /**
   * Resets default white background
   */
  async resetDefaultBackgroundColor(): Promise<void> {
    await this.#client.send('Emulation.setDefaultBackgroundColorOverride');
  }

  /**
   * Hides default white background
   */
  async setTransparentBackgroundColor(): Promise<void> {
    await this.#client.send('Emulation.setDefaultBackgroundColorOverride', {
      color: {r: 0, g: 0, b: 0, a: 0},
    });
  }

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    if (this.#javascriptEnabled === enabled) {
      return;
    }
    this.#javascriptEnabled = enabled;
    await this.#client.send('Emulation.setScriptExecutionDisabled', {
      value: !enabled,
    });
  }
}
