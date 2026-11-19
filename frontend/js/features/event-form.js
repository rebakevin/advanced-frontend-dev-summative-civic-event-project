/* ROLE GUARD: admin only. Creating, editing and deleting events is for admins.
   The page guard (page.json "admin") sends other users to the forbidden page, and the
   backend enforces the same rule on POST, PUT and DELETE /events. The client never
   sends role or is_active. */
(function () {
  window.App = window.App || {};

  var V = App.validate.rules;

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // ISO string from the API -> value for <input type="datetime-local"> (local time).
  function toLocalInput(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // datetime-local value -> ISO string for the API.
  function toIso(local) {
    var d = new Date(local);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  function validDate(message) {
    return function (v) {
      return !v || !isNaN(new Date(v).getTime()) ? '' : message || 'Enter a valid date and time';
    };
  }

  function endsAfterStart() {
    return function (v, values) {
      if (!v || !values.starts_at) return '';
      var start = new Date(values.starts_at).getTime();
      var end = new Date(v).getTime();
      if (isNaN(start) || isNaN(end)) return '';
      return end > start ? '' : 'End must be after the start';
    };
  }

  function initEventForm() {
    var $form = $('#event-form');
    if (!$form.length) return;

    var eventId = new URLSearchParams(window.location.search).get('id');
    var isEdit = !!eventId;
    var existingImage = '';

    var $state = $('#event-form-state');
    var $submit = $('#event-submit');
    var $delete = $('#event-delete');
    var $preview = $('#image-preview');
    var $image = $('#image');

    var formRules = {
      title: [V.required('Title is required')],
      description: [],
      location: [V.required('Location is required')],
      starts_at: [V.required('Start date and time is required'), validDate()],
      ends_at: [V.required('End date and time is required'), validDate(), endsAfterStart()],
    };
    var imageRule = App.upload.rules.image;

    App.validate.bindLive($form, formRules);
    // Changing the start re-checks the end, which depends on it.
    $('#starts_at').on('change', function () {
      if ($('#ends_at').val()) App.validate.validateField($form, formRules, 'ends_at');
    });

    function showExistingImage() {
      if (!existingImage) return;
      var img = document.createElement('img');
      img.setAttribute('src', existingImage);
      img.setAttribute('alt', 'Current event image');
      $preview.empty().append(img).prop('hidden', false);
    }

    App.upload.bindInput($image, imageRule, {
      $preview: $preview,
    });
    // After a cleared or rejected selection the saved image is shown again.
    $image.on('change', function () {
      if (!$image.val()) showExistingImage();
    });

    function fill(event) {
      $('#title').val(event.title || '');
      $('#description').val(event.description || '');
      $('#location').val(event.location || '');
      $('#starts_at').val(toLocalInput(event.starts_at));
      $('#ends_at').val(toLocalInput(event.ends_at));
      existingImage = App.events.imageUrl(event);
      showExistingImage();
    }

    function setMode(heading, submitLabel) {
      $('#event-form-title').text(heading);
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
      App.skeleton.show($state, { type: 'line', count: 6 });
      App.api.get('/events/' + encodeURIComponent(eventId), null, { inline: true })
        .done(function (event) {
          if (!event) {
            window.location.replace(App.pageUrl('not-found'));
            return;
          }
          fill(event);
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

      // The image is optional, but a chosen file is checked again before it is sent.
      var file = $image[0].files && $image[0].files[0];
      if (file) {
        var res = App.upload.check(file, imageRule);
        if (!res.ok) {
          App.validate.showError($image, res.message);
          if (result.valid) $image.trigger('focus');
          return;
        }
      }
      if (!result.valid) return;

      var v = result.values;
      var fd = new FormData();
      fd.append('title', $.trim(v.title));
      fd.append('description', $.trim(v.description));
      fd.append('location', $.trim(v.location));
      fd.append('starts_at', toIso(v.starts_at));
      fd.append('ends_at', toIso(v.ends_at));
      if (file) fd.append('image', file);

      $('#image-progress').empty();
      var req = App.upload.send(isEdit ? '/events/' + encodeURIComponent(eventId) : '/events', fd, {
        method: isEdit ? 'PUT' : 'POST',
        $progressContainer: $('#image-progress'),
        inline: true,
      });

      App.ui.withLoading($submit, req)
        .done(function (event) {
          var id = (event && event.id) || eventId;
          App.flash.set(isEdit ? 'Event updated.' : 'Event created.', 'success');
          window.location.href = isEdit && id ? App.pageUrl('event-detail', { id: id }) : App.pageUrl('events');
        })
        .fail(function (err) {
          if (err.status === 400) {
            if (!(Array.isArray(err.data) && App.validate.showServerErrors($form, err.data))) {
              App.toast.error(err.message);
            }
            return;
          }
          App.toast.error(err.message);
        });
    });

    $delete.on('click', function () {
      App.modal.confirm({
        title: 'Delete this event?',
        message: 'This removes the event for everyone. This cannot be undone.',
        confirmLabel: 'Delete event',
        danger: true,
      }).done(function () {
        App.ui.withLoading($delete, App.api.del('/events/' + encodeURIComponent(eventId), { inline: true }))
          .done(function () {
            App.flash.set('Event deleted.', 'success');
            window.location.href = App.pageUrl('events');
          })
          .fail(function (err) {
            App.toast.error(err.message);
          });
      });
    });

    if (isEdit) {
      setMode('Edit event', 'Save changes');
      $delete.prop('hidden', false);
      load();
    } else {
      setMode('Create event', 'Create event');
      showForm();
    }
  }

  $(function () {
    initEventForm();
  });
})();
