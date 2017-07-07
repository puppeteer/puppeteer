let Documentation = {};

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
   */
  constructor(name) {
    this.name = name;
  }
};

module.exports = Documentation;
