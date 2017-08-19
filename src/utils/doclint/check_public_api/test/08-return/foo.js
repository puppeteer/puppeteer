class Foo {
  return42() {
    return 42;
  }

  returnNothing() {
    let e = () => 10;
    e();
  }

  www() {
    if (1 === 1) // eslint-disable-line no-self-compare
      return 'df';
  }

  async asyncFunction() {
  }
}
