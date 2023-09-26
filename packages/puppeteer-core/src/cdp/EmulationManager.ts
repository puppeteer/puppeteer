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
import type {Protocol} from 'devtools-protocol';

import {type CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import type {GeolocationOptions, MediaFeature} from '../api/Page.js';
import {debugError} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';
import {assert} from '../util/assert.js';
import {invokeAtMostOnceForArguments} from '../util/decorators.js';
import {isErrorLike} from '../util/ErrorLike.js';

interface ViewportState {
  viewport?: Viewport;
  active: boolean;
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
export interface ClientProvider {
  clients(): CDPSession[];
  registerState(state: EmulatedState<any>): void;
}

/**
 * @internal
 */
export class EmulatedState<T extends {active: boolean}> {
  #state: T;
  #clientProvider: ClientProvider;
  #updater: (client: CDPSession, state: T) => Promise<void>;

  constructor(
    initialState: T,
    clientProvider: ClientProvider,
    updater: (client: CDPSession, state: T) => Promise<void>
  ) {
    this.#state = initialState;
    this.#clientProvider = clientProvider;
    this.#updater = updater;
    this.#clientProvider.registerState(this);
  }

  async setState(state: T): Promise<void> {
    this.#state = state;
    await this.sync();
  }

  get state(): T {
    return this.#state;
  }

  async sync(): Promise<void> {
    await Promise.all(
      this.#clientProvider.clients().map(client => {
        return this.#updater(client, this.#state);
      })
    );
  }
}

/**
 * @internal
 */
export class EmulationManager {
  #client: CDPSession;

  #emulatingMobile = false;
  #hasTouch = false;

  #states: Array<EmulatedState<any>> = [];

  #viewportState = new EmulatedState<ViewportState>(
    {
      active: false,
    },
    this,
    this.#applyViewport
  );
  #idleOverridesState = new EmulatedState<IdleOverridesState>(
    {
      active: false,
    },
    this,
    this.#emulateIdleState
  );
  #timezoneState = new EmulatedState<TimezoneState>(
    {
      active: false,
    },
    this,
    this.#emulateTimezone
  );
  #visionDeficiencyState = new EmulatedState<VisionDeficiencyState>(
    {
      active: false,
    },
    this,
    this.#emulateVisionDeficiency
  );
  #cpuThrottlingState = new EmulatedState<CpuThrottlingState>(
    {
      active: false,
    },
    this,
    this.#emulateCpuThrottling
  );
  #mediaFeaturesState = new EmulatedState<MediaFeaturesState>(
    {
      active: false,
    },
    this,
    this.#emulateMediaFeatures
  );
  #mediaTypeState = new EmulatedState<MediaTypeState>(
    {
      active: false,
    },
    this,
    this.#emulateMediaType
  );
  #geoLocationState = new EmulatedState<GeoLocationState>(
    {
      active: false,
    },
    this,
    this.#setGeolocation
  );
  #defaultBackgroundColorState = new EmulatedState<DefaultBackgroundColorState>(
    {
      active: false,
    },
    this,
    this.#setDefaultBackgroundColor
  );
  #javascriptEnabledState = new EmulatedState<JavascriptEnabledState>(
    {
      javaScriptEnabled: true,
      active: false,
    },
    this,
    this.#setJavaScriptEnabled
  );

  #secondaryClients = new Set<CDPSession>();

  constructor(client: CDPSession) {
    this.#client = client;
  }

  updateClient(client: CDPSession): void {
    this.#client = client;
    this.#secondaryClients.delete(client);
  }

  registerState(state: EmulatedState<any>): void {
    this.#states.push(state);
  }

  clients(): CDPSession[] {
    return [this.#client, ...Array.from(this.#secondaryClients)];
  }

  async registerSpeculativeSession(client: CDPSession): Promise<void> {
    this.#secondaryClients.add(client);
    client.once(CDPSessionEvent.Disconnected, () => {
      this.#secondaryClients.delete(client);
    });
    // We don't await here because we want to register all state changes before
    // the target is unpaused.
    void Promise.all(
      this.#states.map(s => {
        return s.sync().catch(debugError);
      })
    );
  }

  get javascriptEnabled(): boolean {
    return this.#javascriptEnabledState.state.javaScriptEnabled;
  }

  async emulateViewport(viewport: Viewport): Promise<boolean> {
    await this.#viewportState.setState({
      viewport,
      active: true,
    });

    const mobile = viewport.isMobile || false;
    const hasTouch = viewport.hasTouch || false;
    const reloadNeeded =
      this.#emulatingMobile !== mobile || this.#hasTouch !== hasTouch;
    this.#emulatingMobile = mobile;
    this.#hasTouch = hasTouch;

    return reloadNeeded;
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
    await this.#idleOverridesState.setState({
      active: true,
      overrides,
    });
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

  async emulateTimezone(timezoneId?: string): Promise<void> {
    await this.#timezoneState.setState({
      timezoneId,
      active: true,
    });
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
    await this.#visionDeficiencyState.setState({
      active: true,
      visionDeficiency: type,
    });
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

  async emulateCPUThrottling(factor: number | null): Promise<void> {
    assert(
      factor === null || factor >= 1,
      'Throttling rate should be greater or equal to 1'
    );
    await this.#cpuThrottlingState.setState({
      active: true,
      factor: factor ?? undefined,
    });
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
    await this.#mediaFeaturesState.setState({
      active: true,
      mediaFeatures: features,
    });
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

  async emulateMediaType(type?: string): Promise<void> {
    assert(
      type === 'screen' ||
        type === 'print' ||
        (type ?? undefined) === undefined,
      'Unsupported media type: ' + type
    );
    await this.#mediaTypeState.setState({
      type,
      active: true,
    });
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
    await this.#geoLocationState.setState({
      active: true,
      geoLocation: {
        longitude,
        latitude,
        accuracy,
      },
    });
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

  /**
   * Resets default white background
   */
  async resetDefaultBackgroundColor(): Promise<void> {
    await this.#defaultBackgroundColorState.setState({
      active: true,
      color: undefined,
    });
  }

  /**
   * Hides default white background
   */
  async setTransparentBackgroundColor(): Promise<void> {
    await this.#defaultBackgroundColorState.setState({
      active: true,
      color: {r: 0, g: 0, b: 0, a: 0},
    });
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

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    await this.#javascriptEnabledState.setState({
      active: true,
      javaScriptEnabled: enabled,
    });
  }
}
