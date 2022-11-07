import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import Jasmine from 'jasmine';
import {resolve} from 'path';

interface BuilderOptions {
  config: string;
}

export default createBuilder(
  async (options: BuilderOptions, context: BuilderContext) => {
    const output: BuilderOutput = {
      success: true,
    };

    try {
      const jasmine = new Jasmine();
      const config = resolve(context.workspaceRoot, options.config);
      jasmine.loadConfigFile(config);

      const result = await jasmine.execute();
      if (result.overallStatus !== 'passed') {
        output.success = false;
        output.error = 'Test did not pass test suit';
      }
    } catch (error) {
      output.success = false;
      output.error = (error as Error)?.message ?? error;
    }

    return output;
  }
);
