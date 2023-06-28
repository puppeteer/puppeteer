import {spawn} from 'child_process';

import {
  createBuilder,
  BuilderContext,
  BuilderOutput,
  targetFromTargetString,
  BuilderRun,
} from '@angular-devkit/architect';
import {JsonObject} from '@angular-devkit/core';

import {PuppeteerBuilderOptions} from './types.js';

const terminalStyles = {
  cyan: '\u001b[36;1m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  bold: '\u001b[1m',
  reverse: '\u001b[7m',
  clear: '\u001b[0m',
};

function getError(executable: string, args: string[]) {
  return (
    `Error running '${executable}' with arguments '${args.join(' ')}'.` +
    `\n` +
    'Please look at the output above to determine the issue!'
  );
}

function getExecutable(command: string[]) {
  const executable = command.shift()!;
  const error = getError(executable, command);

  if (executable === 'node') {
    return {
      executable: executable,
      args: command,
      error,
    };
  }

  return {
    executable: `./node_modules/.bin/${executable}`,
    args: command,
    error,
  };
}

async function executeCommand(context: BuilderContext, command: string[]) {
  await new Promise((resolve, reject) => {
    context.logger.debug(`Trying to execute command - ${command.join(' ')}.`);
    const {executable, args, error} = getExecutable(command);

    const child = spawn(executable, args, {
      cwd: context.workspaceRoot,
      stdio: 'inherit',
    });

    child.on('error', message => {
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
    server = await startServer(options, context);

    message('\n Running tests 🧪 ... \n', context);
    for (const command of options.commands) {
      await executeCommand(context, command);
    }

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
