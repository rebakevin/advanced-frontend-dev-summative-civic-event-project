(function () {
  window.App = window.App || {};
  var internal = (App.validateInternal = App.validateInternal || {});

  function collect($form, ruleSet) {
    var values = {};
    $.each(ruleSet, function (name) {
      values[name] = internal.readValue(internal.findField($form, name));
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
    var $input = internal.findField($form, name);
    if (!$input.length) return true;
    var values = collect($form, ruleSet);
    var msg = runRules(ruleSet[name], values[name], values);
    if (msg) internal.showError($input, msg);
    else internal.clearError($input);
    return !msg;
  }

  function form($form, ruleSet) {
    var values = collect($form, ruleSet);
    var valid = true;
    var $first = null;
    $.each(ruleSet, function (name, list) {
      var $input = internal.findField($form, name);
      if (!$input.length) return;
      var msg = runRules(list, values[name], values);
      if (msg) {
        internal.showError($input, msg);
        valid = false;
        if (!$first) $first = $input;
      } else {
        internal.clearError($input);
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
      var $input = internal.findField($form, e.field);
      if (!$input.length) return;
      internal.showError($input, String(e.message));
      mapped = true;
      if (!$first) $first = $input;
    });
    if ($first) $first.trigger('focus');
    return mapped;
  }

  internal.validateField = validateField;
  internal.form = form;
  internal.showServerErrors = showServerErrors;
})();
