const ts = require('typescript');
const path = require('path');
const srcRoot = path.join(__dirname, '..', 'lib');
const configPath = path.join(__dirname, '..', 'tsconfig.json');
const configParseResult = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
  useCaseSensitiveFileNames: false,
  readDirectory: ts.sys.readDirectory,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  onUnRecoverableConfigFileDiagnostic: e => {
    console.error('failed to parse config', configPath);
    console.error(e);
    process.exit(1);
  }
});

const host = ts.createCompilerHost(configParseResult.options, true);
const program = ts.createProgram(configParseResult.fileNames, configParseResult.options, host);

const checker = program.getTypeChecker();
const diagnostics = [];
/** @type {!Map<ts.Declaration, {name: string, wasUsedExternally: boolean}>} */
const internalProperties = new Map();
for (const sourceFile of program.getSourceFiles()) {
  if (!path.normalize(sourceFile.fileName).startsWith(srcRoot))
    continue;
  visit(sourceFile);
}

for (const [declaration, {name, wasUsedExternally}] of internalProperties) {
  if (!wasUsedExternally) {
    diagnostics.push({
      category: ts.DiagnosticCategory.Error,
      code: '',
      file: declaration.getSourceFile(),
      messageText: `Internal property could be made private '${name}'`,
      start: declaration.getStart(),
      length: name.length
    });
  }
}

process.stderr.write(ts.formatDiagnostics(diagnostics, {
  getCanonicalFileName(path) {
    return path;
  },
  getCurrentDirectory() {
    return process.cwd();
  },
  getNewLine() {
    return ts.sys.newLine;
  }
}));
process.exit(diagnostics.length);

/**
 * @param {ts.Node} node
 */
function visit(node) {
  checkForPrivateIdentifier(node);
  node.forEachChild(visit);
}

/**
 * @param {ts.Node} node
 */
function checkForPrivateIdentifier(node) {
  if (node.kind !== ts.SyntaxKind.Identifier)
    return;
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol)
    return;
  const name = symbol.getName();
  if (name.startsWith('$_')) {
    const declaration = symbol.getDeclarations()[0];
    if (!internalProperties.has(declaration))
      internalProperties.set(declaration, {name, wasUsedExternally: false});
    if (!nodeWasDeclaredLocally(node))
      internalProperties.get(declaration).wasUsedExternally = true;
  }
  if (name.startsWith('_') && !nodeWasDeclaredLocally(node)) {
    diagnostics.push({
      category: ts.DiagnosticCategory.Error,
      code: '',
      file: node.getSourceFile(),
      messageText: `Invalid usage of private property '${name}'`,
      start: node.getStart(),
      length: name.length
    });
  }
}

/**
 * @param {ts.Node} node
 */
function nodeWasDeclaredLocally(node) {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol)
    return true;
  const declaration = symbol.getDeclarations()[0];
  if (!declaration)
    return true;
  return declaration.getSourceFile() === node.getSourceFile();
}