/**
 * Copyright 2020 Google Inc. All rights reserved.
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

/* These types exist here until we migrate over to ESM where we can
 * import / export them properly from modules - TS doesn't support
 * exposing interfaces in CommonJS land.
 */
interface PuppeteerEventListener {
  emitter: NodeJS.EventEmitter;
  eventName: string | symbol;
  handler: (...args: any[]) => void;
}
