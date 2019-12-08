import { AnyFunction } from './types';

const noop = () => undefined;

export class TaskQueue {
  private _chain = Promise.resolve() as Promise<any>;

  public postTask(task: AnyFunction): Promise<any> {
    const result = this._chain.then(task);
    this._chain = result.catch(noop);
    return result;
  }
}
