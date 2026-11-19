/* ROLE GUARD: admin only. Creating, editing, publishing and deleting promos is for admins.
   The page guard (page.json "admin") sends other users to the forbidden page, and the
   backend enforces the same rule on POST, PUT, PATCH and DELETE /promos. The client never
   sends role or is_active. */
(function () {
  window.App = window.App || {};

  var V = App.validate.rules;

  function initPromoForm() {
    var $form = $('#promo-form');
    if (!$form.length) return;

    var promoId = new URLSearchParams(window.location.search).get('id');
    var isEdit = !!promoId;

    var $state = $('#promo-form-state');
    var $submit = $('#promo-submit');
    var $delete = $('#promo-delete');
    var $video = $('#video');
    var $hint = $('#video-hint');

    var formRules = {
      title: [V.required('Title is required')],
      description: [V.required('Description is required')],
      caption_text: [V.required('Caption text is required')],
    };
    var videoRule = App.upload.rules.video;

    App.validate.bindLive($form, formRules);
    App.upload.bindInput($video, videoRule);

    function fill(promo) {
      $('#title').val(promo.title || '');
      $('#description').val(promo.description || '');
      $('#caption_text').val(promo.caption_text || '');
      $('#published').prop('checked', App.promos.isPublished(promo));
      // The video is optional when editing: the saved one stays unless a new file is chosen.
      $hint.text('Current video is kept unless you choose a new file. MP4, MOV, AVI or MKV, up to 8 MB.');
    }

    function showForm() {
      App.skeleton.hide($state);
      $state.empty();
      $form.prop('hidden', false);
      $('#title').trigger('focus');
    }

    function load() {
      $form.prop('hidden', true);
      App.skeleton.show($state, { type: 'line', count: 6 });
      App.api.get('/promos/' + encodeURIComponent(promoId), null, { inline: true })
        .done(function (promo) {
          if (!promo) {
            window.location.replace(App.pageUrl('not-found'));
            return;
          }
          fill(promo);
          showForm();
        })
        .fail(function (err) {
          if (err.status === 404) {
            window.location.replace(App.pageUrl('not-found'));
            return;
          }
          App.skeleton.error($state, { message: err.message, onRetry: load });
        });
    }

    $form.on('submit', function (e) {
      e.preventDefault();
      var result = App.validate.form($form, formRules);

      // The video is required on create and optional on edit. A chosen file is checked again.
      var file = $video[0].files && $video[0].files[0];
      var res = file ? App.upload.check(file, videoRule) : { ok: isEdit, message: 'Video is required' };
      var fileError = res.ok ? null : res.message;
      if (fileError) {
        App.validate.showError($video, fileError);
        if (result.valid) $video.trigger('focus');
        return;
      }
      if (!result.valid) return;

      var v = result.values;
      var fd = new FormData();
      fd.append('title', $.trim(v.title));
      fd.append('description', $.trim(v.description));
      fd.append('caption_text', $.trim(v.caption_text));
      if (file) fd.append('video', file);
      // On create the API defaults to published, so the toggle only exists when editing.
      if (isEdit) fd.append('published', $('#published').prop('checked') ? 'true' : 'false');

      $('#video-progress').empty();
      var req = App.upload.send(isEdit ? '/promos/' + encodeURIComponent(promoId) : '/promos', fd, {
        method: isEdit ? 'PUT' : 'POST',
        $progressContainer: $('#video-progress'),
        inline: true,
      });

      App.ui.withLoading($submit, req)
        .done(function (promo) {
          App.promos.invalidate();
          var id = (promo && promo.id) || promoId;
          App.flash.set(isEdit ? 'Promo updated.' : 'Promo created.', 'success');
          window.location.href = isEdit && id ? App.pageUrl('promo-detail', { id: id }) : App.pageUrl('promos');
        })
        .fail(function (err) {
          var shown = err.status === 400 && $.isArray(err.data) && App.validate.showServerErrors($form, err.data);
          if (!shown) App.toast.error(err.message);
        });
    });

    $delete.on('click', function () {
      App.promos.confirmDelete({ id: promoId, title: $.trim($('#title').val()) || 'this promo' }, $delete, function () {
        App.flash.set('Promo deleted.', 'success');
        window.location.href = App.pageUrl('promos');
      });
    });

    if (isEdit) {
      $('#promo-form-title').text('Edit promo');
      $submit.text('Save changes');
      $('#published-field').prop('hidden', false);
      $delete.prop('hidden', false);
      load();
    } else {
      $('#promo-form-title').text('Create promo');
      $submit.text('Create promo');
      showForm();
    }
  }

  $(function () {
    initPromoForm();
  });
})();
