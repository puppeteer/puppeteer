/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Mocha from 'mocha';

class SpecJSONReporter extends Mocha.reporters.Spec {
  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);
    Mocha.reporters.JSON.call(this, runner, options);
  }
}

module.exports = SpecJSONReporter;
