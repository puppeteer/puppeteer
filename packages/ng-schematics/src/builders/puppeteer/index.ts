import {
  createBuilder,
  BuilderContext,
  BuilderOutput,
} from '@angular-devkit/architect';
import {spawn} from 'child_process';

import {PuppeteerBuilderOptions} from './types.js';

function getError(executable: string, args: string[]) {
  return (
    `Puppeteer E2E tests failed!` +
    '\n' +
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

async function executeE2ETest(
  options: PuppeteerBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
  context.logger.debug('Running commands for E2E test.');
  try {
    for (const command of options.commands) {
      await executeCommand(context, command);
    }

    return {success: true};
  } catch (error) {
    if (error instanceof Error) {
      return {success: false, error: error.message};
    }
    return {success: false, error: error as any};
  }
}

export default createBuilder<PuppeteerBuilderOptions>(executeE2ETest) as any;
