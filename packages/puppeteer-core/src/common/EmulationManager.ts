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
import {invokeAtMostOnceForArguments} from '../util/decorators.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {CDPSession, CDPSessionEmittedEvents} from './Connection.js';
import {Viewport} from './PuppeteerViewport.js';
import {debugError} from './util.js';

interface ViewportState {
  viewport?: Viewport;
}

interface IdleOverridesState {
  overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  };
  active: boolean;
}

interface TimezoneState {
  timezoneId?: string;
  active: boolean;
}

interface VisionDeficiencyState {
  visionDeficiency?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type'];
  active: boolean;
}

interface CpuThrottlingState {
  factor?: number;
  active: boolean;
}

interface MediaFeaturesState {
  mediaFeatures?: MediaFeature[];
  active: boolean;
}

interface MediaTypeState {
  type?: string;
  active: boolean;
}

interface GeoLocationState {
  geoLocation?: GeolocationOptions;
  active: boolean;
}

interface DefaultBackgroundColorState {
  color?: Protocol.DOM.RGBA;
  active: boolean;
}

interface JavascriptEnabledState {
  javaScriptEnabled: boolean;
  active: boolean;
}

/**
 * @internal
 */
export class EmulationManager {
  #client: CDPSession;

  #emulatingMobile = false;
  #hasTouch = false;

  #viewportState: ViewportState = {};
  #idleOverridesState: IdleOverridesState = {
    active: false,
  };
  #timezoneState: TimezoneState = {
    active: false,
  };
  #visionDeficiencyState: VisionDeficiencyState = {
    active: false,
  };
  #cpuThrottlingState: CpuThrottlingState = {
    active: false,
  };
  #mediaFeaturesState: MediaFeaturesState = {
    active: false,
  };
  #mediaTypeState: MediaTypeState = {
    active: false,
  };
  #geoLocationState: GeoLocationState = {
    active: false,
  };
  #defaultBackgroundColorState: DefaultBackgroundColorState = {
    active: false,
  };
  #javascriptEnabledState: JavascriptEnabledState = {
    javaScriptEnabled: true,
    active: false,
  };

  #secondaryClients = new Set<CDPSession>();

  constructor(client: CDPSession) {
    this.#client = client;
  }

  updateClient(client: CDPSession): void {
    this.#client = client;
    this.#secondaryClients.delete(client);
  }

  async registerSpeculativeSession(client: CDPSession): Promise<void> {
    this.#secondaryClients.add(client);
    client.once(CDPSessionEmittedEvents.Disconnected, () => {
      return this.#secondaryClients.delete(client);
    });
    // We don't await here because we want to register all state changes before
    // the target is unpaused.
    void this.#syncViewport().catch(debugError);
    void this.#syncIdleState().catch(debugError);
    void this.#syncTimezoneState().catch(debugError);
    void this.#syncVisionDeficiencyState().catch(debugError);
    void this.#syncCpuThrottlingState().catch(debugError);
    void this.#syncMediaFeaturesState().catch(debugError);
    void this.#syncMediaTypeState().catch(debugError);
    void this.#syncGeoLocationState().catch(debugError);
    void this.#syncDefaultBackgroundColorState().catch(debugError);
    void this.#syncJavaScriptEnabledState().catch(debugError);
  }

  get javascriptEnabled(): boolean {
    return this.#javascriptEnabledState.javaScriptEnabled;
  }

  async emulateViewport(viewport: Viewport): Promise<boolean> {
    this.#viewportState = {
      viewport,
    };

    await this.#syncViewport();

    const mobile = viewport.isMobile || false;
    const hasTouch = viewport.hasTouch || false;
    const reloadNeeded =
      this.#emulatingMobile !== mobile || this.#hasTouch !== hasTouch;
    this.#emulatingMobile = mobile;
    this.#hasTouch = hasTouch;

    return reloadNeeded;
  }

  async #syncViewport() {
    await Promise.all([
      this.#applyViewport(this.#client, this.#viewportState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#applyViewport(client, this.#viewportState);
      }),
    ]);
  }

  @invokeAtMostOnceForArguments
  async #applyViewport(
    client: CDPSession,
    viewportState: ViewportState
  ): Promise<void> {
    if (!viewportState.viewport) {
      return;
    }
    const {viewport} = viewportState;
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
      client.send('Emulation.setDeviceMetricsOverride', {
        mobile,
        width,
        height,
        deviceScaleFactor,
        screenOrientation,
      }),
      client.send('Emulation.setTouchEmulationEnabled', {
        enabled: hasTouch,
      }),
    ]);
  }

  async emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void> {
    this.#idleOverridesState = {
      active: true,
      overrides,
    };
    await this.#syncIdleState();
  }

  async #syncIdleState() {
    await Promise.all([
      this.#emulateIdleState(this.#client, this.#idleOverridesState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#emulateIdleState(client, this.#idleOverridesState);
      }),
    ]);
  }

  @invokeAtMostOnceForArguments
  async #emulateIdleState(
    client: CDPSession,
    idleStateState: IdleOverridesState
  ): Promise<void> {
    if (!idleStateState.active) {
      return;
    }
    if (idleStateState.overrides) {
      await client.send('Emulation.setIdleOverride', {
        isUserActive: idleStateState.overrides.isUserActive,
        isScreenUnlocked: idleStateState.overrides.isScreenUnlocked,
      });
    } else {
      await client.send('Emulation.clearIdleOverride');
    }
  }

  @invokeAtMostOnceForArguments
  async #emulateTimezone(
    client: CDPSession,
    timezoneState: TimezoneState
  ): Promise<void> {
    if (!timezoneState.active) {
      return;
    }
    try {
      await client.send('Emulation.setTimezoneOverride', {
        timezoneId: timezoneState.timezoneId || '',
      });
    } catch (error) {
      if (isErrorLike(error) && error.message.includes('Invalid timezone')) {
        throw new Error(`Invalid timezone ID: ${timezoneState.timezoneId}`);
      }
      throw error;
    }
  }

  async #syncTimezoneState() {
    await Promise.all([
      this.#emulateTimezone(this.#client, this.#timezoneState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#emulateTimezone(client, this.#timezoneState);
      }),
    ]);
  }

  async emulateTimezone(timezoneId?: string): Promise<void> {
    this.#timezoneState = {
      timezoneId,
      active: true,
    };
    await this.#syncTimezoneState();
  }

  @invokeAtMostOnceForArguments
  async #emulateVisionDeficiency(
    client: CDPSession,
    visionDeficiency: VisionDeficiencyState
  ): Promise<void> {
    if (!visionDeficiency.active) {
      return;
    }
    await client.send('Emulation.setEmulatedVisionDeficiency', {
      type: visionDeficiency.visionDeficiency || 'none',
    });
  }

  async #syncVisionDeficiencyState() {
    await Promise.all([
      this.#emulateVisionDeficiency(this.#client, this.#visionDeficiencyState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#emulateVisionDeficiency(
          client,
          this.#visionDeficiencyState
        );
      }),
    ]);
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
    assert(
      !type || visionDeficiencies.has(type),
      `Unsupported vision deficiency: ${type}`
    );
    this.#visionDeficiencyState = {
      active: true,
      visionDeficiency: type,
    };
    await this.#syncVisionDeficiencyState();
  }

  @invokeAtMostOnceForArguments
  async #emulateCpuThrottling(
    client: CDPSession,
    state: CpuThrottlingState
  ): Promise<void> {
    if (!state.active) {
      return;
    }
    await client.send('Emulation.setCPUThrottlingRate', {
      rate: state.factor ?? 1,
    });
  }

  async #syncCpuThrottlingState() {
    await Promise.all([
      this.#emulateCpuThrottling(this.#client, this.#cpuThrottlingState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#emulateCpuThrottling(client, this.#cpuThrottlingState);
      }),
    ]);
  }

  async emulateCPUThrottling(factor: number | null): Promise<void> {
    assert(
      factor === null || factor >= 1,
      'Throttling rate should be greater or equal to 1'
    );
    this.#cpuThrottlingState = {
      active: true,
      factor: factor ?? undefined,
    };
    await this.#syncCpuThrottlingState();
  }

  @invokeAtMostOnceForArguments
  async #emulateMediaFeatures(
    client: CDPSession,
    state: MediaFeaturesState
  ): Promise<void> {
    if (!state.active) {
      return;
    }
    await client.send('Emulation.setEmulatedMedia', {
      features: state.mediaFeatures,
    });
  }

  async #syncMediaFeaturesState() {
    await Promise.all([
      this.#emulateMediaFeatures(this.#client, this.#mediaFeaturesState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#emulateMediaFeatures(client, this.#mediaFeaturesState);
      }),
    ]);
  }

  async emulateMediaFeatures(features?: MediaFeature[]): Promise<void> {
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
    }
    this.#mediaFeaturesState = {
      active: true,
      mediaFeatures: features,
    };
    await this.#syncMediaFeaturesState();
  }

  @invokeAtMostOnceForArguments
  async #emulateMediaType(
    client: CDPSession,
    state: MediaTypeState
  ): Promise<void> {
    if (!state.active) {
      return;
    }
    await client.send('Emulation.setEmulatedMedia', {
      media: state.type || '',
    });
  }

  async #syncMediaTypeState() {
    await Promise.all([
      this.#emulateMediaType(this.#client, this.#mediaTypeState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#emulateMediaType(client, this.#mediaTypeState);
      }),
    ]);
  }

  async emulateMediaType(type?: string): Promise<void> {
    assert(
      type === 'screen' ||
        type === 'print' ||
        (type ?? undefined) === undefined,
      'Unsupported media type: ' + type
    );
    this.#mediaTypeState = {
      type,
      active: true,
    };
    await this.#syncMediaTypeState();
  }

  @invokeAtMostOnceForArguments
  async #setGeolocation(
    client: CDPSession,
    state: GeoLocationState
  ): Promise<void> {
    if (!state.active) {
      return;
    }
    await client.send(
      'Emulation.setGeolocationOverride',
      state.geoLocation
        ? {
            longitude: state.geoLocation.longitude,
            latitude: state.geoLocation.latitude,
            accuracy: state.geoLocation.accuracy,
          }
        : undefined
    );
  }

  async #syncGeoLocationState() {
    await Promise.all([
      this.#setGeolocation(this.#client, this.#geoLocationState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#setGeolocation(client, this.#geoLocationState);
      }),
    ]);
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
    this.#geoLocationState = {
      active: true,
      geoLocation: {
        longitude,
        latitude,
        accuracy,
      },
    };
    await this.#syncGeoLocationState();
  }

  @invokeAtMostOnceForArguments
  async #setDefaultBackgroundColor(
    client: CDPSession,
    state: DefaultBackgroundColorState
  ): Promise<void> {
    if (!state.active) {
      return;
    }
    await client.send('Emulation.setDefaultBackgroundColorOverride', {
      color: state.color,
    });
  }

  async #syncDefaultBackgroundColorState() {
    await Promise.all([
      this.#setDefaultBackgroundColor(
        this.#client,
        this.#defaultBackgroundColorState
      ),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#setDefaultBackgroundColor(
          client,
          this.#defaultBackgroundColorState
        );
      }),
    ]);
  }

  /**
   * Resets default white background
   */
  async resetDefaultBackgroundColor(): Promise<void> {
    this.#defaultBackgroundColorState = {
      active: true,
      color: undefined,
    };
    await this.#syncDefaultBackgroundColorState();
  }

  /**
   * Hides default white background
   */
  async setTransparentBackgroundColor(): Promise<void> {
    this.#defaultBackgroundColorState = {
      active: true,
      color: {r: 0, g: 0, b: 0, a: 0},
    };
    await this.#syncDefaultBackgroundColorState();
  }

  @invokeAtMostOnceForArguments
  async #setJavaScriptEnabled(
    client: CDPSession,
    state: JavascriptEnabledState
  ): Promise<void> {
    if (!state.active) {
      return;
    }
    await client.send('Emulation.setScriptExecutionDisabled', {
      value: !state.javaScriptEnabled,
    });
  }

  async #syncJavaScriptEnabledState() {
    await Promise.all([
      this.#setJavaScriptEnabled(this.#client, this.#javascriptEnabledState),
      ...Array.from(this.#secondaryClients).map(client => {
        return this.#setJavaScriptEnabled(client, this.#javascriptEnabledState);
      }),
    ]);
  }

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    this.#javascriptEnabledState = {
      active: true,
      javaScriptEnabled: enabled,
    };
    await this.#syncJavaScriptEnabledState();
  }
}
