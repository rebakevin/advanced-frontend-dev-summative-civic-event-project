(function () {
  window.App = window.App || {};
  var U = (App.uploadInternal = App.uploadInternal || {});

  function bindInput($input, rule, opts) {
    opts = opts || {};
    var previewUrl = null;
    var $preview = opts.$preview;

    function clearPreview() {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
      if ($preview && $preview.length) {
        $preview.find('img').remove();
        $preview.prop('hidden', true);
      }
    }

    function showPreview(file) {
      clearPreview();
      if (!$preview || !$preview.length || !/^image\//.test(file.type || '')) return;
      previewUrl = URL.createObjectURL(file);
      var img = document.createElement('img');
      img.setAttribute('src', previewUrl);
      img.setAttribute('alt', 'Preview of the selected image');
      $preview.empty().append(img).prop('hidden', false);
    }

    $input.on('change', function () {
      var file = this.files && this.files[0];
      if (!file) {
        clearPreview();
        App.validate.clearError($input);
        return;
      }
      var res = U.check(file, rule);
      if (!res.ok) {
        $input.val('');
        clearPreview();
        App.validate.showError($input, res.message);
        if (typeof opts.onInvalid === 'function') opts.onInvalid(res.message);
        return;
      }
      App.validate.clearError($input);
      showPreview(file);
      if (typeof opts.onValid === 'function') opts.onValid(file);
    });

    return { clearPreview: clearPreview };
  }

  U.bindInput = bindInput;
})();
