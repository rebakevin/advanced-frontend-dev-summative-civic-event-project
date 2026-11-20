(function () {
  window.App = window.App || {};
  var internal = (App.validateInternal = App.validateInternal || {});

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

  internal.PASSWORD_MESSAGE = 'Password needs 8+ characters, upper and lower case, a number and a special character';

  function str(v) {
    return v === undefined || v === null ? '' : String(v);
  }

  // Rule helpers: return true when the value passes.
  function required(v) {
    return $.trim(str(v)) !== '';
  }

  function email(v) {
    return EMAIL_RE.test($.trim(str(v)));
  }

  // Returns the list of unmet rules (empty when the password is fine).
  function passwordPolicy(v) {
    var s = str(v);
    var unmet = [];
    if (s.length < 8) unmet.push('At least 8 characters');
    if (!/[A-Z]/.test(s)) unmet.push('An uppercase letter');
    if (!/[a-z]/.test(s)) unmet.push('A lowercase letter');
    if (!/[0-9]/.test(s)) unmet.push('A number');
    if (!/[^A-Za-z0-9\s]/.test(s)) unmet.push('A special character');
    return unmet;
  }

  // level 0..4 for the .strength[data-level] meter.
  function strength(v) {
    var s = str(v);
    if (!s) return { level: 0, label: '' };
    var score = 5 - passwordPolicy(s).length;
    var level = score <= 1 ? 1 : score - 1;
    if (s.length < 8 && level > 2) level = 2;
    if (level > 4) level = 4;
    return { level: level, label: LABELS[level] };
  }

  function matches(a, b) {
    return str(a) === str(b);
  }

  // Ready-made rule functions for App.validate.form: (value, values) -> message or ''.
  var rules = {
    required: function (message) {
      return function (v) {
        return required(v) ? '' : message || 'This field is required';
      };
    },
    email: function (message) {
      return function (v) {
        return !required(v) || email(v) ? '' : message || 'Enter a valid email address';
      };
    },
    password: function (message) {
      return function (v) {
        return !required(v) || !passwordPolicy(v).length ? '' : message || internal.PASSWORD_MESSAGE;
      };
    },
    matches: function (otherName, message) {
      return function (v, values) {
        return matches(v, values[otherName]) ? '' : message || 'Passwords do not match';
      };
    },
  };

  internal.required = required;
  internal.email = email;
  internal.passwordPolicy = passwordPolicy;
  internal.strength = strength;
  internal.matches = matches;
  internal.rules = rules;
})();
