import {spawn} from 'child_process';

import {
  createBuilder,
  BuilderContext,
  BuilderOutput,
  targetFromTargetString,
  BuilderRun,
} from '@angular-devkit/architect';
import {JsonObject} from '@angular-devkit/core';

import {TestRunner} from '../../schematics/utils/types.js';

import {PuppeteerBuilderOptions} from './types.js';

const terminalStyles = {
  cyan: '\u001b[36;1m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  bold: '\u001b[1m',
  reverse: '\u001b[7m',
  clear: '\u001b[0m',
};

export function getCommandForRunner(runner: TestRunner): [string, ...string[]] {
  switch (runner) {
    case TestRunner.Jasmine:
      return [`jasmine`, '--config=./e2e/jasmine.json'];
    case TestRunner.Jest:
      return [`jest`, '-c', 'e2e/jest.config.js'];
    case TestRunner.Mocha:
      return [`mocha`, '--config=./e2e/.mocharc.js'];
    case TestRunner.Node:
      return ['node', '--test', '--test-reporter', 'spec', 'e2e/build/'];
  }

  throw new Error(`Unknown test runner ${runner}!`);
}

function getExecutable(command: string[]) {
  const executable = command.shift()!;
  const debugError = `Error running '${executable}' with arguments '${command.join(
    ' '
  )}'.`;

  return {
    executable,
    args: command,
    debugError,
    error: 'Please look at the output above to determine the issue!',
  };
}

function updateExecutablePath(command: string, root?: string) {
  if (command === TestRunner.Node) {
    return command;
  }

  let path = 'node_modules/.bin/';
  if (root && root !== '') {
    const nested = root
      .split('/')
      .map(() => {
        return '../';
      })
      .join('');
    path = `${nested}${path}${command}`;
  } else {
    path = `./${path}${command}`;
  }

  return path;
}

async function executeCommand(context: BuilderContext, command: string[]) {
  let project: JsonObject;
  if (context.target) {
    project = await context.getProjectMetadata(context.target.project);
    command[0] = updateExecutablePath(command[0]!, String(project['root']));
  }

  await new Promise(async (resolve, reject) => {
    context.logger.debug(`Trying to execute command - ${command.join(' ')}.`);
    const {executable, args, debugError, error} = getExecutable(command);
    let path = context.workspaceRoot;
    if (context.target) {
      path = `${path}/${project['root']}`;
    }

    const child = spawn(executable, args, {
      cwd: path,
      stdio: 'inherit',
    });

    child.on('error', message => {
      context.logger.debug(debugError);
      console.log(message);
      reject(error);
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(error);
      }
    });
  });
}

function message(
  message: string,
  context: BuilderContext,
  type: 'info' | 'success' | 'error' = 'info'
): void {
  let style: string;
  switch (type) {
    case 'info':
      style = terminalStyles.reverse + terminalStyles.cyan;
      break;
    case 'success':
      style = terminalStyles.reverse + terminalStyles.green;
      break;
    case 'error':
      style = terminalStyles.red;
      break;
  }
  context.logger.info(
    `${terminalStyles.bold}${style}${message}${terminalStyles.clear}`
  );
}

async function startServer(
  options: PuppeteerBuilderOptions,
  context: BuilderContext
): Promise<BuilderRun> {
  context.logger.debug('Trying to start server.');
  const target = targetFromTargetString(options.devServerTarget);
  const defaultServerOptions = await context.getTargetOptions(target);

  const overrides = {
    watch: false,
    host: defaultServerOptions['host'],
    port: options.port ?? defaultServerOptions['port'],
  } as JsonObject;

  message(' Spawning test server ⚙️ ... \n', context);
  const server = await context.scheduleTarget(target, overrides);
  const result = await server.result;
  if (!result.success) {
    throw new Error('Failed to spawn server! Stopping tests...');
  }

  return server;
}

async function executeE2ETest(
  options: PuppeteerBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
  let server: BuilderRun | null = null;
  try {
    message('\n Building tests 🛠️ ... \n', context);
    await executeCommand(context, [`tsc`, '-p', 'e2e/tsconfig.json']);

    server = await startServer(options, context);

    message('\n Running tests 🧪 ... \n', context);
    const testRunnerCommand = getCommandForRunner(options.testRunner);
    await executeCommand(context, testRunnerCommand);

    message('\n 🚀 Test ran successfully! 🚀 ', context, 'success');
    return {success: true};
  } catch (error) {
    message('\n 🛑 Test failed! 🛑 ', context, 'error');
    if (error instanceof Error) {
      return {success: false, error: error.message};
    }
    return {success: false, error: error as string};
  } finally {
    if (server) {
      await server.stop();
    }
  }
}

export default createBuilder<PuppeteerBuilderOptions>(executeE2ETest);
