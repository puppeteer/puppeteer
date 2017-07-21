const jsBuilder = require('./JSBuilder');
const mdBuilder = require('./MDBuilder');
const Documentation = require('./Documentation');

const EXCLUDE_CLASSES = new Set([
  'AwaitedElement',
  'Connection',
  'EmulationManager',
  'FrameManager',
  'Helper',
  'NavigatorWatcher',
  'NetworkManager',
  'ProxyStream',
  'TaskQueue',
]);

const EXCLUDE_METHODS = new Set([
  'Body.constructor',
  'Dialog.constructor',
  'Frame.constructor',
  'Headers.constructor',
  'Headers.fromPayload',
  'InterceptedRequest.constructor',
  'Keyboard.constructor',
  'Page.constructor',
  'Page.create',
  'Request.constructor',
  'Response.constructor',
]);

/**
 * @param {!Page} page
 * @param {string} docsFolderPath
 * @param {string} jsFolderPath
 * @return {!Promise<!Array<string>>}
 */
async function lint(page, docsFolderPath, jsFolderPath) {
  let mdResult = await mdBuilder(page, docsFolderPath);
  let jsResult = await jsBuilder(jsFolderPath);
  let jsDocumentation = filterJSDocumentation(jsResult.documentation);
  let mdDocumentation = mdResult.documentation;

  let jsErrors = jsResult.errors;
  jsErrors.push(...Documentation.validate(jsDocumentation));

  let mdErrors = mdResult.errors;
  mdErrors.push(...Documentation.diff(mdDocumentation, jsDocumentation));
  mdErrors.push(...Documentation.validate(mdDocumentation));
  mdErrors.push(...lintMarkdown(mdDocumentation));

  // Push all errors with proper prefixes
  let errors = jsErrors.map(error => '[JavaScript] ' + error);
  errors.push(...mdErrors.map(error => '[MarkDown] ' + error));
  return errors;
}

/**
 * @param {!Documentation} doc
 * @return {!Array<string>}
 */
function lintMarkdown(doc) {
  const errors = [];
  for (let cls of doc.classesArray) {
    let members = cls.membersArray;

    // Events should go first.
    let eventIndex = 0;
    for (; eventIndex < members.length && members[eventIndex].type === 'event'; ++eventIndex);
    for (; eventIndex < members.length && members[eventIndex].type !== 'event'; ++eventIndex);
    if (eventIndex < members.length)
      errors.push(`Events should go first. Event '${members[eventIndex].name}' in class ${cls.name} breaks order`);

    // Constructor should be right after events and before all other members.
    let constructorIndex = members.findIndex(member => member.type === 'method' && member.name === 'constructor');
    if (constructorIndex > 0 && members[constructorIndex - 1].type !== 'event')
      errors.push(`Constructor of ${cls.name} should go before other methods`);

    // Events should be sorted alphabetically.
    for (let i = 0; i < members.length - 1; ++i) {
      let member1 = cls.membersArray[i];
      let member2 = cls.membersArray[i + 1];
      if (member1.type !== 'event' || member2.type !== 'event')
        continue;
      if (member1.name > member2.name)
        errors.push(`Event '${member1.name}' in class ${cls.name} breaks alphabetic ordering of events`);
    }

    // All other members should be sorted alphabetically.
    for (let i = 0; i < members.length - 1; ++i) {
      let member1 = cls.membersArray[i];
      let member2 = cls.membersArray[i + 1];
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
  let classes = [];
  for (let cls of jsDocumentation.classesArray) {
    if (EXCLUDE_CLASSES.has(cls.name))
      continue;
    let members = cls.membersArray.filter(member => {
      if (member.name.startsWith('_'))
        return false;
      return !EXCLUDE_METHODS.has(`${cls.name}.${member.name}`);
    });
    classes.push(new Documentation.Class(cls.name, members));
  }
  return new Documentation(classes);
}

module.exports = lint;
