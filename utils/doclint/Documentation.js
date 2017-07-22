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
}

Documentation.Class = class {
  /**
   * @param {string} name
   * @param {!Array<!Documentation.Member>} membersArray
   */
  constructor(name, membersArray) {
    this.name = name;
    this.membersArray = membersArray;
    this.members = new Map();
    this.properties = new Map();
    this.methods = new Map();
    this.events = new Map();
    for (let member of membersArray) {
      this.members.set(member.name, member);
      if (member.type === 'method')
        this.methods.set(member.name, member);
      else if (member.type === 'property')
        this.properties.set(member.name, member);
      else if (member.type === 'event')
        this.events.set(member.name, member);
    }
  }
};

Documentation.Member = class {
  /**
   * @param {string} type
   * @param {string} name
   * @param {!Array<!Documentation.Argument>} argsArray
   * @param {boolean} hasReturn
   * @param {boolean} async
   */
  constructor(type, name, argsArray, hasReturn, async) {
    this.type = type;
    this.name = name;
    this.argsArray = argsArray;
    this.args = new Map();
    this.hasReturn = hasReturn;
    this.async = async;
    for (let arg of argsArray)
      this.args.set(arg.name, arg);
  }

  /**
   * @param {string} name
   * @param {!Array<!Documentation.Argument>} argsArray
   * @param {boolean} hasReturn
   * @return {!Documentation.Member}
   */
  static createMethod(name, argsArray, hasReturn, async) {
    return new Documentation.Member('method', name, argsArray, hasReturn, async);
  }

  /**
   * @param {string} name
   * @return {!Documentation.Member}
   */
  static createProperty(name) {
    return new Documentation.Member('property', name, [], false, false);
  }

  /**
   * @param {string} name
   * @return {!Documentation.Member}
   */
  static createEvent(name) {
    return new Documentation.Member('event', name, [], false, false);
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

module.exports = Documentation;

