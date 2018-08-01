class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  InvalidNodeError: class extends CustomError {},
  ProtocolError: class extends CustomError {},
  TimeoutError: class extends CustomError {},
};
