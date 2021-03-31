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
const {
  MODULES_TO_CHECK_FOR_COVERAGE,
} = require('../../../test/coverage-utils');

const EXCLUDE_PROPERTIES = new Set([
  'Browser.create',
  'Headers.fromPayload',
  'Page.create',
  'JSHandle.toString',
  'TimeoutError.name',
  /* This isn't an actual property, but a TypeScript generic.
   * DocLint incorrectly parses it as a property.
   */
  'ElementHandle.ElementType',
]);

/**
 * @param {!Page} page
 * @param {!Array<!Source>} mdSources
 * @returns {!Promise<!Array<!Message>>}
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
  const errors = jsErrors.map((error) => '[JavaScript] ' + error);
  errors.push(...mdErrors.map((error) => '[MarkDown] ' + error));
  return errors.map((error) => Message.error(error));
};

/**
 * @param {!Documentation} doc
 * @returns {!Array<string>}
 */
function checkSorting(doc) {
  const errors = [];
  for (const cls of doc.classesArray) {
    const members = cls.membersArray;

    // Events should go first.
    let eventIndex = 0;
    for (
      ;
      eventIndex < members.length && members[eventIndex].kind === 'event';
      ++eventIndex
    );
    for (
      ;
      eventIndex < members.length && members[eventIndex].kind !== 'event';
      ++eventIndex
    );
    if (eventIndex < members.length)
      errors.push(
        `Events should go first. Event '${members[eventIndex].name}' in class ${cls.name} breaks order`
      );

    // Constructor should be right after events and before all other members.
    const constructorIndex = members.findIndex(
      (member) => member.kind === 'method' && member.name === 'constructor'
    );
    if (constructorIndex > 0 && members[constructorIndex - 1].kind !== 'event')
      errors.push(`Constructor of ${cls.name} should go before other methods`);

    // Events should be sorted alphabetically.
    for (let i = 0; i < members.length - 1; ++i) {
      const member1 = cls.membersArray[i];
      const member2 = cls.membersArray[i + 1];
      if (member1.kind !== 'event' || member2.kind !== 'event') continue;
      if (member1.name > member2.name)
        errors.push(
          `Event '${member1.name}' in class ${cls.name} breaks alphabetic ordering of events`
        );
    }

    // All other members should be sorted alphabetically.
    for (let i = 0; i < members.length - 1; ++i) {
      const member1 = cls.membersArray[i];
      const member2 = cls.membersArray[i + 1];
      if (member1.kind === 'event' || member2.kind === 'event') continue;
      if (member1.kind === 'method' && member1.name === 'constructor') continue;
      if (member1.name > member2.name) {
        let memberName1 = `${cls.name}.${member1.name}`;
        if (member1.kind === 'method') memberName1 += '()';
        let memberName2 = `${cls.name}.${member2.name}`;
        if (member2.kind === 'method') memberName2 += '()';
        errors.push(
          `Bad alphabetic ordering of ${cls.name} members: ${memberName1} should go after ${memberName2}`
        );
      }
    }
  }
  return errors;
}

/**
 * @param {!Documentation} jsDocumentation
 * @returns {!Documentation}
 */
function filterJSDocumentation(jsDocumentation) {
  const includedClasses = new Set(Object.keys(MODULES_TO_CHECK_FOR_COVERAGE));
  // Filter private classes and methods.
  const classes = [];
  for (const cls of jsDocumentation.classesArray) {
    if (includedClasses && !includedClasses.has(cls.name)) continue;
    const members = cls.membersArray.filter(
      (member) => !EXCLUDE_PROPERTIES.has(`${cls.name}.${member.name}`)
    );
    classes.push(new Documentation.Class(cls.name, members));
  }
  return new Documentation(classes);
}

/**
 * @param {!Documentation} doc
 * @returns {!Array<string>}
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
      if (members.has(member.kind + ' ' + member.name))
        errors.push(
          `Duplicate declaration of ${member.kind} ${cls.name}.${member.name}()`
        );
      members.add(member.kind + ' ' + member.name);
      const args = new Set();
      for (const arg of member.argsArray) {
        if (args.has(arg.name))
          errors.push(
            `Duplicate declaration of argument ${cls.name}.${member.name} "${arg.name}"`
          );
        args.add(arg.name);
      }
    }
  }
  return errors;
}

// All the methods from our EventEmitter that we don't document for each subclass.
const EVENT_LISTENER_METHODS = new Set([
  'emit',
  'listenerCount',
  'off',
  'on',
  'once',
  'removeListener',
  'addListener',
  'removeAllListeners',
]);

/* Methods that are defined in code but are not documented */
const expectedNotFoundMethods = new Map([
  ['Browser', EVENT_LISTENER_METHODS],
  ['BrowserContext', EVENT_LISTENER_METHODS],
  ['CDPSession', EVENT_LISTENER_METHODS],
  ['Page', EVENT_LISTENER_METHODS],
  ['WebWorker', EVENT_LISTENER_METHODS],
]);

/**
 * @param {!Documentation} actual
 * @param {!Documentation} expected
 * @returns {!Array<string>}
 */
function compareDocumentations(actual, expected) {
  const errors = [];

  const actualClasses = Array.from(actual.classes.keys()).sort();
  const expectedClasses = Array.from(expected.classes.keys()).sort();
  const classesDiff = diff(actualClasses, expectedClasses);

  /* These have been moved onto PuppeteerNode but we want to document them under
   * Puppeteer. See https://github.com/puppeteer/puppeteer/pull/6504 for details.
   */
  const expectedPuppeteerClassMissingMethods = new Set([
    'createBrowserFetcher',
    'defaultArgs',
    'executablePath',
    'launch',
  ]);

  for (const className of classesDiff.extra)
    errors.push(`Non-existing class found: ${className}`);

  for (const className of classesDiff.missing) {
    if (className === 'PuppeteerNode') {
      continue;
    }
    errors.push(`Class not found: ${className}`);
  }

  for (const className of classesDiff.equal) {
    const actualClass = actual.classes.get(className);
    const expectedClass = expected.classes.get(className);
    const actualMethods = Array.from(actualClass.methods.keys()).sort();
    const expectedMethods = Array.from(expectedClass.methods.keys()).sort();
    const methodDiff = diff(actualMethods, expectedMethods);

    for (const methodName of methodDiff.extra) {
      if (
        expectedPuppeteerClassMissingMethods.has(methodName) &&
        actualClass.name === 'Puppeteer'
      ) {
        continue;
      }
      errors.push(`Non-existing method found: ${className}.${methodName}()`);
    }

    for (const methodName of methodDiff.missing) {
      const missingMethodsForClass = expectedNotFoundMethods.get(className);
      if (missingMethodsForClass && missingMethodsForClass.has(methodName))
        continue;
      errors.push(`Method not found: ${className}.${methodName}()`);
    }

    for (const methodName of methodDiff.equal) {
      const actualMethod = actualClass.methods.get(methodName);
      const expectedMethod = expectedClass.methods.get(methodName);
      if (!actualMethod.type !== !expectedMethod.type) {
        if (actualMethod.type)
          errors.push(
            `Method ${className}.${methodName} has unneeded description of return type`
          );
        else
          errors.push(
            `Method ${className}.${methodName} is missing return type description`
          );
      } else if (actualMethod.hasReturn) {
        checkType(
          `Method ${className}.${methodName} has the wrong return type: `,
          actualMethod.type,
          expectedMethod.type
        );
      }
      const actualArgs = Array.from(actualMethod.args.keys());
      const expectedArgs = Array.from(expectedMethod.args.keys());
      const argsDiff = diff(actualArgs, expectedArgs);

      if (argsDiff.extra.length || argsDiff.missing.length) {
        /* Doclint cannot handle the parameter type of the CDPSession send method.
         * so we just ignore it.
         */
        const isCdpSessionSend =
          className === 'CDPSession' && methodName === 'send';
        if (!isCdpSessionSend) {
          const text = [
            `Method ${className}.${methodName}() fails to describe its parameters:`,
          ];
          for (const arg of argsDiff.missing)
            text.push(`- Argument not found: ${arg}`);
          for (const arg of argsDiff.extra)
            text.push(`- Non-existing argument found: ${arg}`);
          errors.push(text.join('\n'));
        }
      }

      for (const arg of argsDiff.equal)
        checkProperty(
          `Method ${className}.${methodName}()`,
          actualMethod.args.get(arg),
          expectedMethod.args.get(arg)
        );
    }
    const actualProperties = Array.from(actualClass.properties.keys()).sort();
    const expectedProperties = Array.from(
      expectedClass.properties.keys()
    ).sort();
    const propertyDiff = diff(actualProperties, expectedProperties);
    for (const propertyName of propertyDiff.extra) {
      if (className === 'Puppeteer' && propertyName === 'product') {
        continue;
      }
      errors.push(`Non-existing property found: ${className}.${propertyName}`);
    }
    for (const propertyName of propertyDiff.missing)
      errors.push(`Property not found: ${className}.${propertyName}`);

    const actualEvents = Array.from(actualClass.events.keys()).sort();
    const expectedEvents = Array.from(expectedClass.events.keys()).sort();
    const eventsDiff = diff(actualEvents, expectedEvents);
    for (const eventName of eventsDiff.extra)
      errors.push(
        `Non-existing event found in class ${className}: '${eventName}'`
      );
    for (const eventName of eventsDiff.missing)
      errors.push(`Event not found in class ${className}: '${eventName}'`);
  }

  /**
   * @param {string} source
   * @param {!Documentation.Member} actual
   * @param {!Documentation.Member} expected
   */
  function checkProperty(source, actual, expected) {
    checkType(source + ' ' + actual.name, actual.type, expected.type);
  }

  /**
   * @param {string} source
   * @param {!string} actualName
   * @param {!string} expectedName
   */
  function namingMisMatchInTypeIsExpected(source, actualName, expectedName) {
    /* The DocLint tooling doesn't deal well with generics in TypeScript
     * source files. We could fix this but the longterm plan is to
     * auto-generate documentation from TS. So instead we document here
     * the methods that use generics that DocLint trips up on and if it
     * finds a mismatch that matches one of the cases below it doesn't
     * error. This still means we're protected from accidental changes, as
     * if the mismatch doesn't exactly match what's described below
     * DocLint will fail.
     */
    const expectedNamingMismatches = new Map([
      [
        'Method CDPSession.send() method',
        {
          actualName: 'string',
          expectedName: 'T',
        },
      ],
      [
        'Method CDPSession.send() params',
        {
          actualName: 'Object',
          expectedName: 'CommandParameters[T]',
        },
      ],
      [
        'Method ElementHandle.click() options',
        {
          actualName: 'Object',
          expectedName: 'ClickOptions',
        },
      ],
      [
        'Method ElementHandle.press() options',
        {
          actualName: 'Object',
          expectedName: 'PressOptions',
        },
      ],
      [
        'Method ElementHandle.press() key',
        {
          actualName: 'string',
          expectedName: 'KeyInput',
        },
      ],
      [
        'Method Keyboard.down() key',
        {
          actualName: 'string',
          expectedName: 'KeyInput',
        },
      ],
      [
        'Method Keyboard.press() key',
        {
          actualName: 'string',
          expectedName: 'KeyInput',
        },
      ],
      [
        'Method Keyboard.up() key',
        {
          actualName: 'string',
          expectedName: 'KeyInput',
        },
      ],
      [
        'Method Mouse.down() options',
        {
          actualName: 'Object',
          expectedName: 'MouseOptions',
        },
      ],
      [
        'Method Mouse.up() options',
        {
          actualName: 'Object',
          expectedName: 'MouseOptions',
        },
      ],
      [
        'Method Mouse.wheel() options',
        {
          actualName: 'Object',
          expectedName: 'MouseWheelOptions',
        },
      ],
      [
        'Method Tracing.start() options',
        {
          actualName: 'Object',
          expectedName: 'TracingOptions',
        },
      ],
      [
        'Method Frame.waitForSelector() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForSelectorOptions',
        },
      ],
      [
        'Method Frame.waitForXPath() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForSelectorOptions',
        },
      ],
      [
        'Method HTTPRequest.abort() errorCode',
        {
          actualName: 'string',
          expectedName: 'ErrorCode',
        },
      ],
      [
        'Method Frame.goto() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Frame.waitForNavigation() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Frame.setContent() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Puppeteer.defaultArgs() options',
        {
          actualName: 'Object',
          expectedName: 'ChromeArgOptions',
        },
      ],
      [
        'Method Page.goBack() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Page.goForward() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Page.goto() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Page.reload() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Page.setContent() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method Page.waitForNavigation() options.waitUntil',
        {
          actualName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array',
          expectedName:
            '"load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array<PuppeteerLifeCycleEvent>',
        },
      ],
      [
        'Method BrowserContext.overridePermissions() permissions',
        {
          actualName: 'Array<string>',
          expectedName: 'Array<PermissionType>',
        },
      ],
      [
        'Method Puppeteer.createBrowserFetcher() options',
        {
          actualName: 'Object',
          expectedName: 'BrowserFetcherOptions',
        },
      ],
      [
        'Method Page.authenticate() credentials',
        {
          actualName: 'Object',
          expectedName: 'Credentials',
        },
      ],
      [
        'Method Page.emulateMediaFeatures() features',
        {
          actualName: 'Array<Object>',
          expectedName: 'Array<MediaFeature>',
        },
      ],
      [
        'Method Page.emulate() options.viewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Page.emulateNetworkConditions() networkConditions',
        {
          actualName: 'Object',
          expectedName: 'NetworkConditions',
        },
      ],
      [
        'Method Page.setViewport() options.viewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Page.setViewport() viewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Page.connect() options.defaultViewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Puppeteer.connect() options.defaultViewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Puppeteer.launch() options.defaultViewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Page.launch() options.defaultViewport',
        {
          actualName: 'Object',
          expectedName: 'Viewport',
        },
      ],
      [
        'Method Page.goBack() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForOptions',
        },
      ],
      [
        'Method Page.goForward() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForOptions',
        },
      ],
      [
        'Method Page.reload() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForOptions',
        },
      ],
      [
        'Method Page.waitForNavigation() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForOptions',
        },
      ],
      [
        'Method Page.pdf() options',
        {
          actualName: 'Object',
          expectedName: 'PDFOptions',
        },
      ],
      [
        'Method Page.screenshot() options',
        {
          actualName: 'Object',
          expectedName: 'ScreenshotOptions',
        },
      ],
      [
        'Method Page.setContent() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForOptions',
        },
      ],
      [
        'Method Page.setCookie() ...cookies',
        {
          actualName: '...Object',
          expectedName: '...CookieParam',
        },
      ],
      [
        'Method Page.emulateVisionDeficiency() type',
        {
          actualName: 'string',
          expectedName: 'Object',
        },
      ],
      [
        'Method Accessibility.snapshot() options',
        {
          actualName: 'Object',
          expectedName: 'SnapshotOptions',
        },
      ],
      [
        'Method Browser.waitForTarget() options',
        {
          actualName: 'Object',
          expectedName: 'WaitForTargetOptions',
        },
      ],
      [
        'Method EventEmitter.emit() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.listenerCount() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.off() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.on() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.once() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.removeListener() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.addListener() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method EventEmitter.removeAllListeners() event',
        {
          actualName: 'string|symbol',
          expectedName: 'EventType',
        },
      ],
      [
        'Method Coverage.startCSSCoverage() options',
        {
          actualName: 'Object',
          expectedName: 'CSSCoverageOptions',
        },
      ],
      [
        'Method Coverage.startJSCoverage() options',
        {
          actualName: 'Object',
          expectedName: 'JSCoverageOptions',
        },
      ],
      [
        'Method Mouse.click() options.button',
        {
          actualName: '"left"|"right"|"middle"',
          expectedName: 'MouseButton',
        },
      ],
      [
        'Method Frame.click() options.button',
        {
          actualName: '"left"|"right"|"middle"',
          expectedName: 'MouseButton',
        },
      ],
      [
        'Method Page.click() options.button',
        {
          actualName: '"left"|"right"|"middle"',
          expectedName: 'MouseButton',
        },
      ],
      [
        'Method HTTPRequest.continue() overrides',
        {
          actualName: 'Object',
          expectedName: 'ContinueRequestOverrides',
        },
      ],
      [
        'Method HTTPRequest.respond() response',
        {
          actualName: 'Object',
          expectedName: 'ResponseForRequest',
        },
      ],
      [
        'Method Frame.addScriptTag() options',
        {
          actualName: 'Object',
          expectedName: 'FrameAddScriptTagOptions',
        },
      ],
      [
        'Method Frame.addStyleTag() options',
        {
          actualName: 'Object',
          expectedName: 'FrameAddStyleTagOptions',
        },
      ],
      [
        'Method Frame.waitForFunction() options',
        {
          actualName: 'Object',
          expectedName: 'FrameWaitForFunctionOptions',
        },
      ],
      [
        'Method BrowserContext.overridePermissions() permissions',
        {
          actualName: 'Array<string>',
          expectedName: 'Array<Object>',
        },
      ],
      [
        'Method Puppeteer.connect() options',
        {
          actualName: 'Object',
          expectedName: 'ConnectOptions',
        },
      ],
      [
        'Method Page.deleteCookie() ...cookies',
        {
          actualName: '...Object',
          expectedName: '...DeleteCookiesRequest',
        },
      ],
      [
        'Method Page.emulateVisionDeficiency() type',
        {
          actualName: 'string',
          expectedName:
            '"none"|"achromatopsia"|"blurredVision"|"deuteranopia"|"protanopia"|"tritanopia"',
        },
      ],
      [
        'Method BrowserContext.overridePermissions() permissions',
        {
          actualName: 'Array<string>',
          expectedName: 'Array<Permission>',
        },
      ],
      [
        'Method HTTPRequest.respond() response.body',
        {
          actualName: 'string|Buffer',
          expectedName: 'Object',
        },
      ],
      [
        'Method HTTPRequest.respond() response.contentType',
        {
          actualName: 'string',
          expectedName: 'Object',
        },
      ],
      [
        'Method HTTPRequest.respond() response.status',
        {
          actualName: 'number',
          expectedName: 'Object',
        },
      ],
    ]);

    const expectedForSource = expectedNamingMismatches.get(source);
    if (!expectedForSource) return false;

    const namingMismatchIsExpected =
      expectedForSource.actualName === actualName &&
      expectedForSource.expectedName === expectedName;

    return namingMismatchIsExpected;
  }

  /**
   * @param {string} source
   * @param {!Documentation.Type} actual
   * @param {!Documentation.Type} expected
   */
  function checkType(source, actual, expected) {
    // TODO(@JoelEinbinder): check functions and Serializable
    if (actual.name.includes('unction') || actual.name.includes('Serializable'))
      return;
    // We don't have nullchecks on for TypeScript
    const actualName = actual.name.replace(/[\? ]/g, '');
    // TypeScript likes to add some spaces
    const expectedName = expected.name.replace(/\ /g, '');
    const namingMismatchIsExpected = namingMisMatchInTypeIsExpected(
      source,
      actualName,
      expectedName
    );
    if (expectedName !== actualName && !namingMismatchIsExpected)
      errors.push(`${source} ${actualName} != ${expectedName}`);

    /* If we got a naming mismatch and it was expected, don't check the properties
     * as they will likely be considered "wrong" by DocLint too.
     */
    if (namingMismatchIsExpected) return;

    /* Some methods cause errors in the property checks for an unknown reason
     * so we support a list of methods whose parameters are not checked.
     */
    const skipPropertyChecksOnMethods = new Set([
      'Method Page.deleteCookie() ...cookies',
      'Method Page.setCookie() ...cookies',
      'Method Puppeteer.connect() options',
    ]);
    if (skipPropertyChecksOnMethods.has(source)) return;

    const actualPropertiesMap = new Map(
      actual.properties.map((property) => [property.name, property.type])
    );
    const expectedPropertiesMap = new Map(
      expected.properties.map((property) => [property.name, property.type])
    );
    const propertiesDiff = diff(
      Array.from(actualPropertiesMap.keys()).sort(),
      Array.from(expectedPropertiesMap.keys()).sort()
    );
    for (const propertyName of propertiesDiff.extra)
      errors.push(`${source} has unexpected property ${propertyName}`);
    for (const propertyName of propertiesDiff.missing)
      errors.push(`${source} is missing property ${propertyName}`);
    for (const propertyName of propertiesDiff.equal)
      checkType(
        source + '.' + propertyName,
        actualPropertiesMap.get(propertyName),
        expectedPropertiesMap.get(propertyName)
      );
  }

  return errors;
}

/**
 * @param {!Array<string>} actual
 * @param {!Array<string>} expected
 * @returns {{extra: !Array<string>, missing: !Array<string>, equal: !Array<string>}}
 */
function diff(actual, expected) {
  const N = actual.length;
  const M = expected.length;
  if (N === 0 && M === 0) return { extra: [], missing: [], equal: [] };
  if (N === 0) return { extra: [], missing: expected.slice(), equal: [] };
  if (M === 0) return { extra: actual.slice(), missing: [], equal: [] };
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
  while (i >= 0) extra.push(actual[i--]);
  while (j >= 0) missing.push(expected[j--]);
  extra.reverse();
  missing.reverse();
  equal.reverse();
  return { extra, missing, equal };

  function val(i, j) {
    return i < 0 || j < 0 ? 0 : d[i][j];
  }
}
