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

class Documentation {
  /**
   * @param {!Array<!Documentation.Class>} classesArray
   */
  constructor(classesArray) {
    this.classesArray = classesArray;
    /** @type {!Map<string, !Documentation.Class>} */
    this.classes = new Map();
    for (const cls of classesArray)
      this.classes.set(cls.name, cls);
  }
}

Documentation.Class = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Member>} membersArray
   */
  constructor(name, membersArray) {
    this.name = name;
    this.membersArray = membersArray;
    /** @type {!Map<string, !Documentation.Member>} */
    this.members = new Map();
    /** @type {!Map<string, !Documentation.Member>} */
    this.properties = new Map();
    /** @type {!Map<string, !Documentation.Member>} */
    this.methods = new Map();
    /** @type {!Map<string, !Documentation.Member>} */
    this.events = new Map();
    for (const member of membersArray) {
      this.members.set(member.name, member);
      if (member.kind === 'method')
        this.methods.set(member.name, member);
      else if (member.kind === 'property')
        this.properties.set(member.name, member);
      else if (member.kind === 'event')
        this.events.set(member.name, member);
    }
  }
};

Documentation.Member = class {
  /**
   * @param {string} kind
   * @param {string} name
   * @param {!Documentation.Type} type
   * @param {!Array<!Documentation.Member>} argsArray
   */
  constructor(kind, name, type, argsArray) {
    this.kind = kind;
    this.name = name;
    this.type = type;
    this.argsArray = argsArray;
    /** @type {!Map<string, !Documentation.Member>} */
    this.args = new Map();
    for (const arg of argsArray)
      this.args.set(arg.name, arg);
  }

  /**
   * @param {string} name
   * @param {!Array<!Documentation.Member>} argsArray
   * @param {?Documentation.Type} returnType
   * @return {!Documentation.Member}
   */
  static createMethod(name, argsArray, returnType) {
    return new Documentation.Member('method', name, returnType, argsArray,);
  }

  /**
   * @param {string} name
   * @param {!Documentation.Type}
   * @return {!Documentation.Member}
   */
  static createProperty(name, type) {
    return new Documentation.Member('property', name, type, []);
  }

  /**
   * @param {string} name
   * @return {!Documentation.Member}
   */
  static createEvent(name) {
    return new Documentation.Member('event', name, null, []);
  }
};

Documentation.Type = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Member>=} properties
   */
  constructor(name, properties = []) {
    this.name = name;
    this.properties = properties;
  }
};

module.exports = Documentation;

