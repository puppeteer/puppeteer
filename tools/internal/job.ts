import {createHash} from 'crypto';
import {existsSync, Stats} from 'fs';
import {mkdir, readFile, stat, writeFile} from 'fs/promises';
import {tmpdir} from 'os';
import {dirname, join} from 'path';

import {hasMagic, globSync} from 'glob';

interface JobContext {
  name: string;
  inputs: string[];
  outputs: string[];
}

class JobBuilder {
  #inputs: string[] = [];
  #outputs: string[] = [];
  #callback: (ctx: JobContext) => Promise<void>;
  #name: string;
  #value = '';
  #force = false;

  constructor(name: string, callback: (ctx: JobContext) => Promise<void>) {
    this.#name = name;
    this.#callback = callback;
  }

  get jobHash(): string {
    return createHash('sha256').update(this.#name).digest('hex');
  }

  force() {
    this.#force = true;
    return this;
  }

  value(value: string) {
    this.#value = value;
    return this;
  }

  inputs(inputs: string[]): JobBuilder {
    this.#inputs = inputs.flatMap(value => {
      if (hasMagic(value)) {
        return globSync(value);
      }
      return value;
    });
    return this;
  }

  outputs(outputs: string[]): JobBuilder {
    if (!this.#name) {
      this.#name = outputs.join(' and ');
    }

    this.#outputs = outputs;
    return this;
  }

  async build(): Promise<void> {
    console.log(`Running job ${this.#name}...`);
    // For debugging.
    if (this.#force) {
      return await this.#run();
    }
    // In case we deleted an output file on purpose.
    if (!this.getOutputStats()) {
      return await this.#run();
    }
    // Run if the job has a value, but it changes.
    if (this.#value) {
      if (!(await this.isValueDifferent())) {
        return;
      }
      return await this.#run();
    }
    // Always run when there is no output.
    if (!this.#outputs.length) {
      return await this.#run();
    }
    // Make-like comparator.
    if (!(await this.areInputsNewer())) {
      return;
    }
    return await this.#run();
  }

  async isValueDifferent(): Promise<boolean> {
    const file = join(tmpdir(), `puppeteer/${this.jobHash}.txt`);
    await mkdir(dirname(file), {recursive: true});
    if (!existsSync(file)) {
      await writeFile(file, this.#value);
      return true;
    }
    return this.#value !== (await readFile(file, 'utf8'));
  }

  #outputStats?: Stats[];
  async getOutputStats(): Promise<Stats[] | undefined> {
    if (this.#outputStats) {
      return this.#outputStats;
    }
    try {
      this.#outputStats = await Promise.all(
        this.#outputs.map(output => {
          return stat(output);
        })
      );
    } catch {}
    return this.#outputStats;
  }

  async areInputsNewer(): Promise<boolean> {
    const inputStats = await Promise.all(
      this.#inputs.map(input => {
        return stat(input);
      })
    );
    const outputStats = await this.getOutputStats();
    if (
      outputStats &&
      outputStats.reduce(reduceMinTime, Infinity) >
        inputStats.reduce(reduceMaxTime, 0)
    ) {
      return false;
    }
    return true;
  }

  #run(): Promise<void> {
    return this.#callback({
      name: this.#name,
      inputs: this.#inputs,
      outputs: this.#outputs,
    });
  }
}

export const job = (
  name: string,
  callback: (ctx: JobContext) => Promise<void>
): JobBuilder => {
  return new JobBuilder(name, callback);
};

const reduceMaxTime = (time: number, stat: Stats) => {
  return time < stat.mtimeMs ? stat.mtimeMs : time;
};

const reduceMinTime = (time: number, stat: Stats) => {
  return time > stat.mtimeMs ? stat.mtimeMs : time;
};
