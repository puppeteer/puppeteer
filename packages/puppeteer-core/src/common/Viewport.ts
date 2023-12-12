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

/**
 * @public
 */
export interface Viewport {
  /**
   * The page width in CSS pixels.
   *
   * @remarks
   * Setting this value to `0` will reset this value to the system default.
   */
  width: number;
  /**
   * The page height in CSS pixels.
   *
   * @remarks
   * Setting this value to `0` will reset this value to the system default.
   */
  height: number;
  /**
   * Specify device scale factor.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio | devicePixelRatio} for more info.
   *
   * @remarks
   * Setting this value to `0` will reset this value to the system default.
   *
   * @defaultValue `1`
   */
  deviceScaleFactor?: number;
  /**
   * Whether the `meta viewport` tag is taken into account.
   * @defaultValue `false`
   */
  isMobile?: boolean;
  /**
   * Specifies if the viewport is in landscape mode.
   * @defaultValue `false`
   */
  isLandscape?: boolean;
  /**
   * Specify if the viewport supports touch events.
   * @defaultValue `false`
   */
  hasTouch?: boolean;
}
