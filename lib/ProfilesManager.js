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

class ProfilesManager {
  /**
   * @param {!Connection} client
   */
  constructor(client) {
    this._client = client;
    this._profiling = false;
  }

  /**
   * @param {number=} samplingFrequencyHz
   * @return {!Promise}
   */
  async startCpuProfile(samplingFrequencyHz = 10000) {
    if (this._profiling)
      throw Error('The CPU profiler has already been started.');
    this._profiling = true;
    await this._client.send('Profiler.setSamplingInterval', {interval: 1e6 / samplingFrequencyHz});
    await this._client.send('Profiler.start', {});
  }

  /**
   * @return {!Promise<!ProfilesManager.CpuProfile>}
   */
  async stopCpuProfile() {
    if (!this._profiling)
      throw Error(`Cannot stop the CPU profiler. It hasn't been started.`);
    const profile = await this._client.send('Profiler.stop', {});
    this._profiling = false;
    return profile.profile;
  }
}

/** @typedef {!{startTime: number, endTime: number, samples: !Array<number>, timeDeltas: !Array<number>, nodes: !Array<!ProfilesManager.CpuProfileNode>}} */
ProfilesManager.CpuProfile;

/** @typedef {!{id: number, hitCount: number, callFrame: !ProfilesManager.CpuProfileNodeFrame, children: !Array<number>|undefined}} */
ProfilesManager.CpuProfileNode;

/** @typedef {!{functionName: string, scriptId: string, url: string, lineNumber: number|undefined, columnNumber: number|undefined}} */
ProfilesManager.CpuProfileNodeFrame;

module.exports = ProfilesManager;
