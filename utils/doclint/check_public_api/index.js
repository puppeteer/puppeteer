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

const jsBuilder = require('./JSBuilder');
const mdBuilder = require('./MDBuilder');
const Documentation = require('./Documentation');
const Message = require('../Message');

const EXCLUDE_CLASSES = new Set([
  'CSSCoverage',
  'Connection',
  'EmulationManager',
  'FrameManager',
  'JSCoverage',
  'Helper',
  'Launcher',
  'Multimap',
  'NavigatorWatcher',
  'NetworkManager',
  'Pipe',
  'TaskQueue',
  'WaitTask',
]);

const EXCLUDE_METHODS = new Set([
  'Browser.create',
  'Headers.fromPayload',
  'Page.create',
  'JSHandle.toString',
]);

/**
 * @param {!Page} page
 * @param {!Array<!Source>} mdSources
 * @param {!Array<!Source>} jsSources
 * @return {!Promise<!Array<!Message>>}
 */
module.exports = async function lint(page, mdSources, jsSources) {
  const mdResult = await mdBuilder(page, mdSources);
  const jsResult = await jsBuilder(jsSources);
  const jsDocumentation = filterJSDocumentation(jsResult.documentation);
  const mdDocumentation = mdResult.documentation;

  const jsErrors = jsResult.errors;
  jsErrors.push(...checkDuplicates(jsDocumentation));

  const mdErrors = mdResult.errors;
  mdErrors.push(...compareDocumentations(mdDocumentation, jsDocumentation));
  mdErrors.push(...checkDuplicates(mdDocumentation));
  mdErrors.push(...checkSorting(mdDocumentation));

  // Push all errors with proper prefixes
  const errors = jsErrors.map(error => '[JavaScript] ' + error);
  errors.push(...mdErrors.map(error => '[MarkDown] ' + error));
  return errors.map(error => Message.error(error));
};

/**
 * @param {!Documentation} doc
 * @return {!Array<string>}
 */
function checkSorting(doc) {
  const errors = [];
  for (const cls of doc.classesArray) {
    const members = cls.membersArray;

    // Events should go first.
    let eventIndex = 0;
    for (; eventIndex < members.length && members[eventIndex].type === 'event'; ++eventIndex);
    for (; eventIndex < members.length && members[eventIndex].type !== 'event'; ++eventIndex);
    if (eventIndex < members.length)
      errors.push(`Events should go first. Event '${members[eventIndex].name}' in class ${cls.name} breaks order`);

    // Constructor should be right after events and before all other members.
    const constructorIndex = members.findIndex(member => member.type === 'method' && member.name === 'constructor');
    if (constructorIndex > 0 && members[constructorIndex - 1].type !== 'event')
      errors.push(`Constructor of ${cls.name} should go before other methods`);

    // Events should be sorted alphabetically.
    for (let i = 0; i < members.length - 1; ++i) {
      const member1 = cls.membersArray[i];
      const member2 = cls.membersArray[i + 1];
      if (member1.type !== 'event' || member2.type !== 'event')
        continue;
      if (member1.name > member2.name)
        errors.push(`Event '${member1.name}' in class ${cls.name} breaks alphabetic ordering of events`);
    }

    // All other members should be sorted alphabetically.
    for (let i = 0; i < members.length - 1; ++i) {
      const member1 = cls.membersArray[i];
      const member2 = cls.membersArray[i + 1];
      if (member1.type === 'event' || member2.type === 'event')
        continue;
      if (member1.type === 'method' && member1.name === 'constructor')
        continue;
      if (member1.name > member2.name) {
        let memberName1 = `${cls.name}.${member1.name}`;
        if (member1.type === 'method')
          memberName1 += '()';
        let memberName2 = `${cls.name}.${member2.name}`;
        if (member2.type === 'method')
          memberName2 += '()';
        errors.push(`Bad alphabetic ordering of ${cls.name} members: ${memberName1} should go after ${memberName2}`);
      }
    }
  }
  return errors;
}

/**
 * @param {!Documentation} jsDocumentation
 * @return {!Documentation}
 */
function filterJSDocumentation(jsDocumentation) {
  // Filter classes and methods.
  const classes = [];
  for (const cls of jsDocumentation.classesArray) {
    if (EXCLUDE_CLASSES.has(cls.name))
      continue;
    const members = cls.membersArray.filter(member => {
      if (member.name.startsWith('_'))
        return false;
      // Exclude all constructors by default.
      if (member.name === 'constructor' && member.type === 'method')
        return false;
      return !EXCLUDE_METHODS.has(`${cls.name}.${member.name}`);
    });
    classes.push(new Documentation.Class(cls.name, members));
  }
  return new Documentation(classes);
}

/**
 * @param {!Documentation} doc
 * @return {!Array<string>}
 */
function checkDuplicates(doc) {
  const errors = [];
  const classes = new Set();
  // Report duplicates.
  for (const cls of doc.classesArray) {
    if (classes.has(cls.name))
      errors.push(`Duplicate declaration of class ${cls.name}`);
    classes.add(cls.name);
    const members = new Set();
    for (const member of cls.membersArray) {
      if (members.has(member.type + ' ' + member.name))
        errors.push(`Duplicate declaration of ${member.type} ${cls.name}.${member.name}()`);
      members.add(member.type + ' ' + member.name);
      const args = new Set();
      for (const arg of member.argsArray) {
        if (args.has(arg.name))
          errors.push(`Duplicate declaration of argument ${cls.name}.${member.name} "${arg.name}"`);
        args.add(arg.name);
      }
    }
  }
  return errors;
}

/**
 * @param {!Documentation} actual
 * @param {!Documentation} expected
 * @return {!Array<string>}
 */
function compareDocumentations(actual, expected) {
  const errors = [];

  const actualClasses = Array.from(actual.classes.keys()).sort();
  const expectedClasses = Array.from(expected.classes.keys()).sort();
  const classesDiff = diff(actualClasses, expectedClasses);
  for (const className of classesDiff.extra)
    errors.push(`Non-existing class found: ${className}`);
  for (const className of classesDiff.missing)
    errors.push(`Class not found: ${className}`);

  for (const className of classesDiff.equal) {
    const actualClass = actual.classes.get(className);
    const expectedClass = expected.classes.get(className);
    const actualMethods = Array.from(actualClass.methods.keys()).sort();
    const expectedMethods = Array.from(expectedClass.methods.keys()).sort();
    const methodDiff = diff(actualMethods, expectedMethods);
    for (const methodName of methodDiff.extra)
      errors.push(`Non-existing method found: ${className}.${methodName}()`);
    for (const methodName of methodDiff.missing)
      errors.push(`Method not found: ${className}.${methodName}()`);

    for (const methodName of methodDiff.equal) {
      const actualMethod = actualClass.methods.get(methodName);
      const expectedMethod = expectedClass.methods.get(methodName);
      if (actualMethod.hasReturn !== expectedMethod.hasReturn) {
        if (actualMethod.hasReturn)
          errors.push(`Method ${className}.${methodName} has unneeded description of return type`);
        else if (!expectedMethod.async)
          errors.push(`Method ${className}.${methodName} is missing return type description`);
        else
          errors.push(`Async method ${className}.${methodName} should describe return type Promise`);
      }
      const actualArgs = Array.from(actualMethod.args.keys());
      const expectedArgs = Array.from(expectedMethod.args.keys());
      const argDiff = diff(actualArgs, expectedArgs);
      if (argDiff.extra.length || argDiff.missing.length) {
        const text = [`Method ${className}.${methodName}() fails to describe its parameters:`];
        for (const arg of argDiff.missing)
          text.push(`- Argument not found: ${arg}`);
        for (const arg of argDiff.extra)
          text.push(`- Non-existing argument found: ${arg}`);
        errors.push(text.join('\n'));
      }
    }
    const actualProperties = Array.from(actualClass.properties.keys()).sort();
    const expectedProperties = Array.from(expectedClass.properties.keys()).sort();
    const propertyDiff = diff(actualProperties, expectedProperties);
    for (const propertyName of propertyDiff.extra)
      errors.push(`Non-existing property found: ${className}.${propertyName}`);
    for (const propertyName of propertyDiff.missing)
      errors.push(`Property not found: ${className}.${propertyName}`);

    const actualEvents = Array.from(actualClass.events.keys()).sort();
    const expectedEvents = Array.from(expectedClass.events.keys()).sort();
    const eventsDiff = diff(actualEvents, expectedEvents);
    for (const eventName of eventsDiff.extra)
      errors.push(`Non-existing event found in class ${className}: '${eventName}'`);
    for (const eventName of eventsDiff.missing)
      errors.push(`Event not found in class ${className}: '${eventName}'`);
  }
  return errors;
}

/**
 * @param {!Array<string>} actual
 * @param {!Array<string>} expected
 * @return {{extra: !Array<string>, missing: !Array<string>, equal: !Array<string>}}
 */
function diff(actual, expected) {
  const N = actual.length;
  const M = expected.length;
  if (N === 0 && M === 0)
    return { extra: [], missing: [], equal: []};
  if (N === 0)
    return {extra: [], missing: expected.slice(), equal: []};
  if (M === 0)
    return {extra: actual.slice(), missing: [], equal: []};
  const d = new Array(N);
  const bt = new Array(N);
  for (let i = 0; i < N; ++i) {
    d[i] = new Array(M);
    bt[i] = new Array(M);
    for (let j = 0; j < M; ++j) {
      const top = val(i - 1, j);
      const left = val(i, j - 1);
      if (top > left) {
        d[i][j] = top;
        bt[i][j] = 'extra';
      } else {
        d[i][j] = left;
        bt[i][j] = 'missing';
      }
      const diag = val(i - 1, j - 1);
      if (actual[i] === expected[j] && d[i][j] < diag + 1) {
        d[i][j] = diag + 1;
        bt[i][j] = 'eq';
      }
    }
  }
  // Backtrack results.
  let i = N - 1;
  let j = M - 1;
  const missing = [];
  const extra = [];
  const equal = [];
  while (i >= 0 && j >= 0) {
    switch (bt[i][j]) {
      case 'extra':
        extra.push(actual[i]);
        i -= 1;
        break;
      case 'missing':
        missing.push(expected[j]);
        j -= 1;
        break;
      case 'eq':
        equal.push(actual[i]);
        i -= 1;
        j -= 1;
        break;
    }
  }
  while (i >= 0)
    extra.push(actual[i--]);
  while (j >= 0)
    missing.push(expected[j--]);
  extra.reverse();
  missing.reverse();
  equal.reverse();
  return {extra, missing, equal};

  function val(i, j) {
    return i < 0 || j < 0 ? 0 : d[i][j];
  }
}

