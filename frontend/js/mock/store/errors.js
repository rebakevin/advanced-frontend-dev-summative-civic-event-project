(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  // Thrown by handlers; the transport turns it into {status, message[, errors]}.
  function MockError(status, message, errors) {
    this.status = status;
    this.message = message;
    this.errors = errors;
  }

  App.mock.internal.MockError = MockError;

  App.mock.internal.ok = function (data, message, status) {
    var s = status || 200;
    var body = { status: s, message: message || 'OK' };
    if (data !== undefined) body.data = data;
    return { status: s, body: body };
  };

  // Usage: throw App.mock.error(404, 'Event not found');
  App.mock.internal.error = function (status, message, errors) {
    return new MockError(status, message, errors);
  };

  App.mock.internal.isError = function (err) {
    return err instanceof MockError;
  };
})();
