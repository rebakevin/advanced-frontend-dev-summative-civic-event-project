(function () {
  window.App = window.App || {};
  var internal = App.validateInternal;

  App.validate = {
    messages: { email: 'Enter a valid email address', password: internal.PASSWORD_MESSAGE },
    required: internal.required,
    email: internal.email,
    passwordPolicy: internal.passwordPolicy,
    strength: internal.strength,
    matches: internal.matches,
    rules: internal.rules,
    form: internal.form,
    validateField: internal.validateField,
    showError: internal.showError,
    clearError: internal.clearError,
    showServerErrors: internal.showServerErrors,
    bindLive: internal.bindLive,
    bindStrengthMeter: internal.bindStrengthMeter,
  };
})();
