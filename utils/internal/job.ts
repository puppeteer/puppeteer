import {Stats} from 'fs';
import {stat} from 'fs/promises';
import {glob} from 'glob';
import path from 'path';

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

  constructor(name: string, callback: (ctx: JobContext) => Promise<void>) {
    this.#name = name;
    this.#callback = callback;
  }

  inputs(inputs: string[]): JobBuilder {
    this.#inputs = inputs.flatMap(value => {
      value = path.resolve(__dirname, '..', '..', value);
      const paths = glob.sync(value);
      return paths.length ? paths : [value];
    });
    return this;
  }

  outputs(outputs: string[]): JobBuilder {
    if (!this.#name) {
      this.#name = outputs[0]!;
    }

    this.#outputs = outputs.map(value => {
      return path.resolve(__dirname, '..', '..', value);
    });
    return this;
  }

  async build(): Promise<void> {
    console.log(`Running job ${this.#name}...`);

    let shouldRun = true;

    const inputStats = await Promise.all(
      this.#inputs.map(input => {
        return stat(input);
      })
    );
    let outputStats: Stats[];
    try {
      outputStats = await Promise.all(
        this.#outputs.map(output => {
          return stat(output);
        })
      );

      if (
        outputStats.reduce(reduceMaxTime, 0) >=
        inputStats.reduce(reduceMinTime, Infinity)
      ) {
        shouldRun = false;
      }
    } catch {}

    if (shouldRun) {
      this.#run();
    }
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
