class Documentation {
  /**
   * @param {!Array<!Documentation.Class>} clasesArray
   */
  constructor(classesArray) {
    this.classesArray = classesArray;
    this.classes = new Map();
    for (let cls of classesArray)
      this.classes.set(cls.name, cls);
  }

  /**
   * @param {!Documentation} actual
   * @param {!Documentation} expected
   * @return {!Array<string>}
   */
  static diff(actual, expected) {
    const errors = [];

    const actualClasses = Array.from(actual.classes.keys()).sort();
    const expectedClasses = Array.from(expected.classes.keys()).sort();
    let classesDiff = diff(actualClasses, expectedClasses);
    for (let className of classesDiff.extra)
      errors.push(`Non-existing class found: ${className}`);
    for (let className of classesDiff.missing)
      errors.push(`Class not found: ${className}`);

    for (let className of classesDiff.equal) {
      const actualClass = actual.classes.get(className);
      const expectedClass = expected.classes.get(className);
      const actualMethods = Array.from(actualClass.methods.keys()).sort();
      const expectedMethods = Array.from(expectedClass.methods.keys()).sort();
      const methodDiff = diff(actualMethods, expectedMethods);
      for (let methodName of methodDiff.extra)
        errors.push(`Non-existing method found: ${className}.${methodName}()`);
      for (let methodName of methodDiff.missing)
        errors.push(`Method not found: ${className}.${methodName}()`);

      for (let methodName of methodDiff.equal) {
        const actualMethod = actualClass.methods.get(methodName);
        const expectedMethod = expectedClass.methods.get(methodName);
        const actualArgs = Array.from(actualMethod.args.keys());
        const expectedArgs = Array.from(expectedMethod.args.keys());
        const argDiff = diff(actualArgs, expectedArgs);
        if (argDiff.extra.length || argDiff.missing.length) {
          let text = [`Method ${className}.${methodName}() fails to describe its parameters:`];
          for (let arg of argDiff.missing)
            text.push(`- Argument not found: ${arg}`);
          for (let arg of argDiff.extra)
            text.push(`- Non-existing argument found: ${arg}`);
          errors.push(text.join('\n'));
        }
      }
      const actualProperties = Array.from(actualClass.properties.keys()).sort();
      const expectedProperties = Array.from(expectedClass.properties.keys()).sort();
      const propertyDiff = diff(actualProperties, expectedProperties);
      for (let propertyName of propertyDiff.extra)
        errors.push(`Non-existing property found: ${className}.${propertyName}`);
      for (let propertyName of propertyDiff.missing)
        errors.push(`Property not found: ${className}.${propertyName}`);
    }
    return errors;
  }

  /**
   * @param {!Documentation} doc
   * @return {!Array<string>}
   */
  static validate(doc) {
    const errors = [];
    let classes = new Set();
    // Report duplicates.
    for (let cls of doc.classesArray) {
      if (classes.has(cls.name))
        errors.push(`Duplicate declaration of class ${cls.name}`);
      classes.add(cls.name);
      let methods = new Set();
      for (let method of cls.methodsArray) {
        if (methods.has(method.name))
          errors.push(`Duplicate declaration of method ${cls.name}.${method.name}()`);
        methods.add(method.name);
        let args = new Set();
        for (let arg of method.argsArray) {
          if (args.has(arg.name))
            errors.push(`Duplicate declaration of argument ${cls.name}.${method.name} "${arg.name}"`);
          args.add(arg.name);
        }
      }
    }
    return errors;
  }
}

Documentation.Class = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Method>} methodsArray
   * @param {!Array<string>} propertiesArray
   */
  constructor(name, methodsArray, propertiesArray) {
    this.name = name;
    this.methodsArray = methodsArray;
    this.methods = new Map();
    for (let method of methodsArray)
      this.methods.set(method.name, method);
    this.propertiesArray = propertiesArray;
    this.properties = new Set(propertiesArray);
  }
};

Documentation.Method = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Argument>} argsArray
   */
  constructor(name, argsArray) {
    this.name = name;
    this.argsArray = argsArray;
    this.args = new Map();
    for (let arg of argsArray)
      this.args.set(arg.name, arg);
  }
};

Documentation.Argument = class {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }
};

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
  let d = new Array(N);
  let bt = new Array(N);
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
      let diag = val(i - 1, j - 1);
      if (actual[i] === expected[j] && d[i][j] < diag + 1) {
        d[i][j] = diag + 1;
        bt[i][j] = 'eq';
      }
    }
  }
  // Backtrack results.
  let i = N - 1;
  let j = M - 1;
  let missing = [];
  let extra = [];
  let equal = [];
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

module.exports = Documentation;

