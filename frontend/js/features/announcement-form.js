/* ROLE GUARD: admin only. Creating, editing and deleting announcements is for admins.
   The page guard (page.json "admin") sends other users to the forbidden page, and the
   backend enforces the same rule on POST, PUT and DELETE /announcements. The client
   never sends role or is_active. */
(function () {
  window.App = window.App || {};

  var V = App.validate.rules;

  function initAnnouncementForm() {
    var $form = $('#announcement-form');
    if (!$form.length) return;

    var announcementId = new URLSearchParams(window.location.search).get('id');
    var isEdit = !!announcementId;

    var $state = $('#announcement-form-state');
    var $submit = $('#announcement-submit');
    var $delete = $('#announcement-delete');
    var $audio = $('#audio');
    var $published = $('#published');

    var formRules = {
      title: [V.required('Title is required')],
    };
    var audioRule = App.upload.rules.audio;

    App.validate.bindLive($form, formRules);
    App.upload.bindInput($audio, audioRule);

    function fill(a) {
      $('#title').val(a.title || '');
      $published.prop('checked', App.announcements.isPublished(a));
      // The audio cannot be replaced on edit, so it is shown read-only.
      $('#audio-current-el').attr('src', a.audio_url || '');
    }

    function setMode(heading, submitLabel) {
      $('#announcement-form-title').text(heading);
      $submit.text(submitLabel);
    }

    function showForm() {
      App.skeleton.hide($state);
      $state.empty();
      $form.prop('hidden', false);
      $('#title').trigger('focus');
    }

    function load() {
      $form.prop('hidden', true);
      App.skeleton.show($state, { type: 'line', count: 4 });
      App.api.get('/announcements/' + encodeURIComponent(announcementId), null, { inline: true })
        .done(function (a) {
          if (!a) {
            window.location.replace(App.pageUrl('not-found'));
            return;
          }
          fill(a);
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

      // The audio is required on create and checked again before it is sent.
      var file = isEdit ? null : $audio[0].files && $audio[0].files[0];
      var res = isEdit ? { ok: true } : App.upload.check(file, audioRule);
      if (!res.ok) {
        App.validate.showError($audio, file ? res.message : 'Audio file is required');
        if (result.valid) $audio.trigger('focus');
        return;
      }
      if (!result.valid) return;

      var v = result.values;
      var fd = new FormData();
      fd.append('title', $.trim(v.title));
      fd.append('published', $published.is(':checked') ? 'true' : 'false');
      if (file) fd.append('audio', file);

      $('#audio-progress').empty();
      var req = App.upload.send(isEdit ? '/announcements/' + encodeURIComponent(announcementId) : '/announcements', fd, {
        method: isEdit ? 'PUT' : 'POST',
        $progressContainer: $('#audio-progress'),
        inline: true,
      });

      App.ui.withLoading($submit, req)
        .done(function (a) {
          var id = (a && a.id) || announcementId;
          App.flash.set(isEdit ? 'Announcement updated.' : 'Announcement created.', 'success');
          window.location.href = isEdit && id ? App.pageUrl('announcement-detail', { id: id }) : App.pageUrl('announcements');
        })
        .fail(function (err) {
          var shown = err.status === 400 && $.isArray(err.data) && App.validate.showServerErrors($form, err.data);
          if (!shown) App.toast.error(err.message);
        });
    });

    $delete.on('click', function () {
      App.announcements.confirmDelete({ id: announcementId, title: $('#title').val() }, $delete, function () {
        App.flash.set('Announcement deleted.', 'success');
        window.location.href = App.pageUrl('announcements');
      });
    });

    if (isEdit) {
      setMode('Edit announcement', 'Save changes');
      // Edit mode: no file picker, show the current audio instead.
      $('#audio-field').prop('hidden', true);
      $audio.prop('required', false);
      $('#audio-current').prop('hidden', false);
      $delete.prop('hidden', false);
      load();
    } else {
      setMode('Create announcement', 'Create announcement');
      showForm();
    }
  }

  $(function () {
    initAnnouncementForm();
  });
})();
