(function () {
  window.App = window.App || {};
  var internal = (App.validateInternal = App.validateInternal || {});

  // Validate on blur; after a field was touched, re-validate on every input.
  function bindLive($form, ruleSet) {
    $.each(ruleSet, function (name) {
      var $input = internal.findField($form, name);
      if (!$input.length) return;
      var touched = false;
      $input.on('blur', function () {
        touched = true;
        internal.validateField($form, ruleSet, name);
      });
      $input.on('input change', function () {
        if (touched) internal.validateField($form, ruleSet, name);
      });
    });
  }

  function bindStrengthMeter($input, $meter, $label) {
    function update() {
      var s = internal.strength($input.val());
      $meter.attr('data-level', String(s.level));
      if ($label && $label.length) $label.text(s.label);
    }
    $input.on('input', update);
    update();
  }

  internal.bindLive = bindLive;
  internal.bindStrengthMeter = bindStrengthMeter;
})();
