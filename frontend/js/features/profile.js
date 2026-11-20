/* ROLE GUARD: signed-in users only (guard.js sends guests to login). This page shows your own account; the backend scopes the data to the token, so no other user's data is requested. */
(function ($) {
  window.App = window.App || {};

  var V = App.validate.rules;

  function initProfile() {
    var $form = $('#profile-form');
    if (!$form.length) return;

    var $state = $('#profile-state');
    var $body = $('#profile-body');
    var current = { full_name: '', email: '' };
    var bound = false;

    var formRules = {
      full_name: [V.required('Full name is required')],
      email: [V.required('Email is required'), V.email()],
    };

    function render(profile) {
      current = { full_name: profile.full_name || '', email: profile.email || '' };
      $('#profile-role').text(profile.role ? String(profile.role).charAt(0).toUpperCase() + String(profile.role).slice(1) : '');
      var active = profile.is_active === true || profile.is_active === 1;
      $('#profile-status').text(active ? 'Active' : 'Disabled')
        .removeClass('badge-green badge-red').addClass(active ? 'badge-green' : 'badge-red');
      $('#profile-since').text(profile.created_at ? App.events.formatDate(profile.created_at) : '');
      $('#full_name').val(current.full_name);
      $('#email').val(current.email);
    }

    function onSubmit(e) {
      e.preventDefault();
      var result = App.validate.form($form, formRules);
      if (!result.valid) return;

      // Only full_name and email are ever sent; role and is_active are read-only.
      var values = { full_name: $.trim(result.values.full_name), email: $.trim(result.values.email) };
      var body = {};
      if (values.full_name !== current.full_name) body.full_name = values.full_name;
      if (values.email !== current.email) body.email = values.email;
      if ($.isEmptyObject(body)) {
        App.toast.success('No changes to save.');
        return;
      }

      var $btn = $form.find('button[type="submit"]');
      App.ui.withLoading($btn, App.api.patch('/users/profile/me', body, { inline: true }))
        .done(function () {
          current = values;
          App.auth.updateUser(values);
          $('#header-user-name').text(values.full_name);
          App.toast.success('Profile updated.');
        })
        .fail(function (err) {
          if (err && err.status === 409) {
            App.validate.showError($('#email'), 'That email is already in use');
            $('#email').trigger('focus');
            return;
          }
          if (err && err.status === 400 && $.isArray(err.data) && App.validate.showServerErrors($form, err.data)) return;
          App.toast.error((err && err.message) || 'Could not update your profile.');
        });
    }

    function load() {
      $body.prop('hidden', true);
      App.skeleton.show($state, { count: 3 });
      App.api.get('/users/profile/me', null, { inline: true })
        .done(function (profile) {
          App.skeleton.hide($state);
          $state.empty();
          render(profile || {});
          $body.prop('hidden', false);
          if (!bound) {
            bound = true;
            App.validate.bindLive($form, formRules);
            $form.on('submit', onSubmit);
          }
        })
        .fail(function (err) {
          App.skeleton.error($state, { message: err && err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initProfile();
  });
})(jQuery);
