(function () {
  window.App = window.App || {};
  var U = App.uploadInternal;

  App.upload = {
    rules: U.rules,
    check: U.check,
    bindInput: U.bindInput,
    progress: U.progress,
    send: U.send,
  };
})();
