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

class Message {
  /**
   * @param {string} type
   * @param {string} text
   */
  constructor(type, text) {
    this.type = type;
    this.text = text;
  }

  /**
   * @param {string} text
   * @returns {!Message}
   */
  static error(text) {
    return new Message('error', text);
  }

  /**
   * @param {string} text
   * @returns {!Message}
   */
  static warning(text) {
    return new Message('warning', text);
  }
}

module.exports = Message;
