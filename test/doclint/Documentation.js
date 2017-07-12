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
   */
  static diff(actual, expected) {
    const result = {};
    // Diff classes.
    const actualClasses = Array.from(actual.classes.keys()).sort();
    const expectedClasses = Array.from(expected.classes.keys()).sort();
    let classesDiff = diff(actualClasses, expectedClasses);
    result.extraClasses = classesDiff.extra;
    result.missingClasses = classesDiff.missing;

    result.extraMethods = [];
    result.missingMethods = [];
    result.badArguments = [];
    for (let className of classesDiff.equal) {
      const actualClass = actual.classes.get(className);
      const expectedClass = expected.classes.get(className);
      const actualMethods = Array.from(actualClass.methods.keys()).sort();
      const expectedMethods = Array.from(expectedClass.methods.keys()).sort();
      const methodDiff = diff(actualMethods, expectedMethods);
      result.extraMethods.push(...(methodDiff.extra.map(methodName => className + '.' + methodName)));
      result.missingMethods.push(...(methodDiff.missing.map(methodName => className + '.' + methodName)));
      for (let methodName of methodDiff.equal) {
        const actualMethod = actualClass.methods.get(methodName);
        const expectedMethod = expectedClass.methods.get(methodName);
        const actualArgs = actualMethod.args.map(arg => arg.name);
        const expectedArgs = expectedMethod.args.map(arg => arg.name);
        const argDiff = diff(actualArgs, expectedArgs);
        if (argDiff.extra.length || argDiff.missing.length) {
          result.badArguments.push({
            method: `${className}.${methodName}`,
            missingArgs: argDiff.missing,
            extraArgs: argDiff.extra
          });
        }
      }
    }
    return result;
  }
}

Documentation.Class = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Method>} methodsArray
   */
  constructor(name, methodsArray) {
    this.name = name;
    this.methodsArray = methodsArray;
    this.methods = new Map();
    for (let method of methodsArray)
      this.methods.set(method.name, method);
  }
};

Documentation.Method = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Argument>} args
   */
  constructor(name, args) {
    this.name = name;
    this.args = args;
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

