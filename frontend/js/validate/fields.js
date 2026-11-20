(function () {
  window.App = window.App || {};
  var internal = (App.validateInternal = App.validateInternal || {});

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

  internal.findField = findField;
  internal.showError = showError;
  internal.clearError = clearError;
  internal.readValue = readValue;
})();
