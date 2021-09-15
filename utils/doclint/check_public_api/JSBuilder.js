const ts = require('typescript');
const path = require('path');
const Documentation = require('./Documentation');
module.exports = checkSources;

/**
 * @param {!Array<!import('../Source')>} sources
 */
function checkSources(sources) {
  // special treatment for Events.js
  const classEvents = new Map();
  const eventsSource = sources.find((source) => source.name() === 'Events.js');
  if (eventsSource) {
    const { Events } = require(eventsSource.filePath());
    for (const [className, events] of Object.entries(Events))
      classEvents.set(
        className,
        Array.from(Object.values(events))
          .filter((e) => typeof e === 'string')
          .map((e) => Documentation.Member.createEvent(e))
      );
  }

  const excludeClasses = new Set([]);
  const program = ts.createProgram({
    options: {
      allowJs: true,
      target: ts.ScriptTarget.ES2017,
    },
    rootNames: sources.map((source) => source.filePath()),
  });
  const checker = program.getTypeChecker();
  const sourceFiles = program.getSourceFiles();
  /** @type {!Array<!Documentation.Class>} */
  const classes = [];
  /** @type {!Map<string, string>} */
  const inheritance = new Map();

  const sourceFilesNoNodeModules = sourceFiles.filter(
    (x) => !x.fileName.includes('node_modules')
  );
  const sourceFileNamesSet = new Set(
    sourceFilesNoNodeModules.map((x) => x.fileName)
  );
  sourceFilesNoNodeModules.map((x) => {
    if (x.fileName.includes('/lib/')) {
      const potentialTSSource = x.fileName
        .replace('lib', 'src')
        .replace('.js', '.ts');
      if (sourceFileNamesSet.has(potentialTSSource)) {
        /* Not going to visit this file because we have the TypeScript src code
         * which we'll use instead.
         */
        return;
      }
    }

    visit(x);
  });

  const errors = [];
  const documentation = new Documentation(
    recreateClassesWithInheritance(classes, inheritance)
  );

  return { errors, documentation };

  /**
   * @param {!Array<!Documentation.Class>} classes
   * @param {!Map<string, string>} inheritance
   * @returns {!Array<!Documentation.Class>}
   */
  function recreateClassesWithInheritance(classes, inheritance) {
    const classesByName = new Map(classes.map((cls) => [cls.name, cls]));
    return classes.map((cls) => {
      const membersMap = new Map();
      for (let wp = cls; wp; wp = classesByName.get(inheritance.get(wp.name))) {
        for (const member of wp.membersArray) {
          // Member was overridden.
          const memberId = member.kind + ':' + member.name;
          if (membersMap.has(memberId)) continue;
          membersMap.set(memberId, member);
        }
      }
      return new Documentation.Class(cls.name, Array.from(membersMap.values()));
    });
  }

  /**
   * @param {!ts.Node} node
   */
  function visit(node) {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      const symbol = node.name
        ? checker.getSymbolAtLocation(node.name)
        : node.symbol;
      let className = symbol.getName();

      if (className === '__class') {
        let parent = node;
        while (parent.parent) parent = parent.parent;
        className = path.basename(parent.fileName, '.js');
      }
      if (className && !excludeClasses.has(className)) {
        classes.push(serializeClass(className, symbol, node));
        const parentClassName = parentClass(node);
        if (parentClassName) inheritance.set(className, parentClassName);
        excludeClasses.add(className);
      }
    }
    ts.forEachChild(node, visit);
  }

  function parentClass(classNode) {
    for (const herigateClause of classNode.heritageClauses || []) {
      for (const heritageType of herigateClause.types) {
        const parentClassName = heritageType.expression.escapedText;
        return parentClassName;
      }
    }
    return null;
  }

  function serializeSymbol(symbol, circular = []) {
    const type = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration
    );
    const name = symbol.getName();
    if (symbol.valueDeclaration && symbol.valueDeclaration.dotDotDotToken) {
      try {
        const innerType = serializeType(type.typeArguments[0], circular);
        innerType.name = '...' + innerType.name;
        return Documentation.Member.createProperty('...' + name, innerType);
      } catch (error) {
        /**
         * DocLint struggles with the paramArgs type on CDPSession.send because
         * it uses a complex type from the devtools-protocol method. Doclint
         * isn't going to be here for much longer so we'll just silence this
         * warning than try to add support which would warrant a huge rewrite.
         */
        if (name !== 'paramArgs') throw error;
      }
    }
    return Documentation.Member.createProperty(
      name,
      serializeType(type, circular)
    );
  }

  /**
   * @param {!ts.ObjectType} type
   */
  function isRegularObject(type) {
    if (type.isIntersection()) return true;
    if (!type.objectFlags) return false;
    if (!('aliasSymbol' in type)) return false;
    if (type.getConstructSignatures().length) return false;
    if (type.getCallSignatures().length) return false;
    if (type.isLiteral()) return false;
    if (type.isUnion()) return false;

    return true;
  }

  /**
   * @param {!ts.Type} type
   * @returns {!Documentation.Type}
   */
  function serializeType(type, circular = []) {
    let typeName = checker.typeToString(type);
    if (
      typeName === 'any' ||
      typeName === '{ [x: string]: string; }' ||
      typeName === '{}'
    )
      typeName = 'Object';
    const nextCircular = [typeName].concat(circular);

    if (isRegularObject(type)) {
      let properties = undefined;
      if (!circular.includes(typeName))
        properties = type
          .getProperties()
          .map((property) => serializeSymbol(property, nextCircular));
      return new Documentation.Type('Object', properties);
    }
    if (type.isUnion() && typeName.includes('|')) {
      const types = type.types.map((type) => serializeType(type, circular));
      const name = types.map((type) => type.name).join('|');
      const properties = [].concat(...types.map((type) => type.properties));
      return new Documentation.Type(
        name.replace(/false\|true/g, 'boolean'),
        properties
      );
    }
    if (type.typeArguments) {
      const properties = [];
      const innerTypeNames = [];
      for (const typeArgument of type.typeArguments) {
        const innerType = serializeType(typeArgument, nextCircular);
        if (innerType.properties) properties.push(...innerType.properties);
        innerTypeNames.push(innerType.name);
      }
      if (
        innerTypeNames.length === 0 ||
        (innerTypeNames.length === 1 && innerTypeNames[0] === 'void')
      )
        return new Documentation.Type(type.symbol.name);
      return new Documentation.Type(
        `${type.symbol.name}<${innerTypeNames.join(', ')}>`,
        properties
      );
    }
    return new Documentation.Type(typeName, []);
  }

  /**
   * @param {!ts.Symbol} symbol
   * @returns {boolean}
   */
  function symbolHasPrivateModifier(symbol) {
    const modifiers =
      (symbol.valueDeclaration && symbol.valueDeclaration.modifiers) || [];
    return modifiers.some(
      (modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword
    );
  }

  /**
   * @param {string} className
   * @param {!ts.Symbol} symbol
   * @returns {}
   */
  function serializeClass(className, symbol, node) {
    /** @type {!Array<!Documentation.Member>} */
    const members = classEvents.get(className) || [];

    for (const [name, member] of symbol.members || []) {
      /* Before TypeScript we denoted private methods with an underscore
       * but in TypeScript we use the private keyword
       * hence we check for either here.
       */
      if (name.startsWith('_') || symbolHasPrivateModifier(member)) continue;

      const memberType = checker.getTypeOfSymbolAtLocation(
        member,
        member.valueDeclaration
      );
      const signature = memberType.getCallSignatures()[0];
      if (signature) members.push(serializeSignature(name, signature));
      else members.push(serializeProperty(name, memberType));
    }

    return new Documentation.Class(className, members);
  }

  /**
   * @param {string} name
   * @param {!ts.Signature} signature
   */
  function serializeSignature(name, signature) {
    const parameters = signature.parameters.map((s) => serializeSymbol(s));
    const returnType = serializeType(signature.getReturnType());
    return Documentation.Member.createMethod(
      name,
      parameters,
      returnType.name !== 'void' ? returnType : null
    );
  }

  /**
   * @param {string} name
   * @param {!ts.Type} type
   */
  function serializeProperty(name, type) {
    return Documentation.Member.createProperty(name, serializeType(type));
  }
}
