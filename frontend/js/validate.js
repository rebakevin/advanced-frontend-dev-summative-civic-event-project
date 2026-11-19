(function () {
  window.App = window.App || {};

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PASSWORD_MESSAGE = 'Password needs 8+ characters, upper and lower case, a number and a special character';
  var LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

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
        return !required(v) || !passwordPolicy(v).length ? '' : message || PASSWORD_MESSAGE;
      };
    },
    matches: function (otherName, message) {
      return function (v, values) {
        return matches(v, values[otherName]) ? '' : message || 'Passwords do not match';
      };
    },
  };

  function findField($form, name) {
    return $form.find('[name="' + String(name).replace(/"/g, '\\"') + '"]').first();
  }

  function errorId($input) {
    var id = $input.attr('id');
    if (!id) {
      id = 'field-' + String($input.attr('name') || 'x') + '-' + Math.floor(Math.random() * 1e6);
      $input.attr('id', id);
    }
    return id + '-error';
  }

  function addDescribedBy($input, id) {
    var ids = ($input.attr('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if ($.inArray(id, ids) === -1) ids.push(id);
    $input.attr('aria-describedby', ids.join(' '));
  }

  function showError($input, message) {
    var $field = $input.closest('.field');
    var id = errorId($input);
    var $err = $field.length ? $field.find('.field-error').first() : $('#' + id);
    if (!$err.length) {
      $err = $('<p class="field-error"></p>');
      if ($field.length) $field.append($err);
      else $input.after($err);
    }
    if (!$err.attr('id')) $err.attr('id', id);
    $err.text(message).prop('hidden', false);
    addDescribedBy($input, $err.attr('id'));
    $input.attr('aria-invalid', 'true');
  }

  function clearError($input) {
    var $field = $input.closest('.field');
    var $err = $field.length ? $field.find('.field-error').first() : $('#' + errorId($input));
    $input.removeAttr('aria-invalid');
    if ($err.length) $err.text('').prop('hidden', true);
  }

  // Reads a field value: checkboxes give a boolean, others a string (passwords untrimmed).
  function readValue($input) {
    if ($input.is(':checkbox')) return $input.prop('checked');
    if ($input.is(':radio')) return $input.filter(':checked').val() || '';
    if ($input.is(':file')) return $input.length && $input[0].files && $input[0].files[0] ? $input[0].files[0] : null;
    var v = $input.val();
    return $input.is(':password') ? v : $.trim(v);
  }

  function collect($form, ruleSet) {
    var values = {};
    $.each(ruleSet, function (name) {
      values[name] = readValue(findField($form, name));
    });
    return values;
  }

  function runRules(list, value, values) {
    for (var i = 0; i < list.length; i++) {
      var msg = list[i](value, values);
      if (msg) return msg;
    }
    return '';
  }

  function validateField($form, ruleSet, name) {
    var $input = findField($form, name);
    if (!$input.length) return true;
    var values = collect($form, ruleSet);
    var msg = runRules(ruleSet[name], values[name], values);
    if (msg) showError($input, msg);
    else clearError($input);
    return !msg;
  }

  function form($form, ruleSet) {
    var values = collect($form, ruleSet);
    var valid = true;
    var $first = null;
    $.each(ruleSet, function (name, list) {
      var $input = findField($form, name);
      if (!$input.length) return;
      var msg = runRules(list, values[name], values);
      if (msg) {
        showError($input, msg);
        valid = false;
        if (!$first) $first = $input;
      } else {
        clearError($input);
      }
    });
    if ($first) $first.trigger('focus');
    return { valid: valid, values: values };
  }

  // Maps API errors [{field, message}] onto fields. Returns true if any mapped.
  function showServerErrors($form, errors) {
    if (!$.isArray(errors)) return false;
    var mapped = false;
    var $first = null;
    $.each(errors, function (i, e) {
      if (!e || !e.field || !e.message) return;
      var $input = findField($form, e.field);
      if (!$input.length) return;
      showError($input, String(e.message));
      mapped = true;
      if (!$first) $first = $input;
    });
    if ($first) $first.trigger('focus');
    return mapped;
  }

  // Validate on blur; after a field was touched, re-validate on every input.
  function bindLive($form, ruleSet) {
    $.each(ruleSet, function (name) {
      var $input = findField($form, name);
      if (!$input.length) return;
      var touched = false;
      $input.on('blur', function () {
        touched = true;
        validateField($form, ruleSet, name);
      });
      $input.on('input change', function () {
        if (touched) validateField($form, ruleSet, name);
      });
    });
  }

  function bindStrengthMeter($input, $meter, $label) {
    function update() {
      var s = strength($input.val());
      $meter.attr('data-level', String(s.level));
      if ($label && $label.length) $label.text(s.label);
    }
    $input.on('input', update);
    update();
  }

  App.validate = {
    messages: { email: 'Enter a valid email address', password: PASSWORD_MESSAGE },
    required: required,
    email: email,
    passwordPolicy: passwordPolicy,
    strength: strength,
    matches: matches,
    rules: rules,
    form: form,
    validateField: validateField,
    showError: showError,
    clearError: clearError,
    showServerErrors: showServerErrors,
    bindLive: bindLive,
    bindStrengthMeter: bindStrengthMeter,
  };
})();
