export class TaskQueue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _chain = Promise.resolve() as Promise<any>;

  postTask<T>(task: () => Promise<T>): Promise<T> {
    const result = this._chain.then(task);
    this._chain = result.catch(() => undefined);
    return result;
  }
}
