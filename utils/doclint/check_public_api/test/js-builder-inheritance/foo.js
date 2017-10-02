class A {
  constructor() {
  }

  foo(a) {
  }

  bar() {
  }
}

class B extends A {
  bar(override) {
  }
}

B.Events = {
  // Event with the same name as a super class method.
  foo: 'foo'
};
