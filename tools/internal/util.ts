import {spawnSync} from 'child_process';

export const spawnAndLog = (...args: string[]): void => {
  const {stdout, stderr} = spawnSync(args[0]!, args.slice(1), {
    encoding: 'utf-8',
    shell: true,
  });
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
};
