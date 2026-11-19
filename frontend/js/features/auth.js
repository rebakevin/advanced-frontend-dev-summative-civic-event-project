(function () {
  window.App = window.App || {};

  var POLICY_MESSAGE = 'Use at least 8 characters with upper and lower case letters, a number and a special character.';

  function initSignup() {
    var $form = $('#signup-form');
    if (!$form.length) return;

    var rules = {
      full_name: [function (v) { return $.trim(v) ? '' : 'Full name is required.'; }],
      email: [
        function (v) { return App.validate.required(v) ? '' : 'Email is required.'; },
        function (v) { return App.validate.email(v) ? '' : 'Enter a valid email address.'; },
      ],
      password: [
        function (v) { return App.validate.required(v) ? '' : 'Password is required.'; },
        function (v) { return App.validate.passwordPolicy(v) ? '' : POLICY_MESSAGE; },
      ],
      confirm_password: [
        function (v) { return App.validate.required(v) ? '' : 'Confirm your password.'; },
        function (v, all) { return App.validate.matches(all.password, v) ? '' : 'Passwords do not match.'; },
      ],
    };

    App.validate.bindLive($form, rules);
    App.validate.bindStrengthMeter($('#password'), $('#password-strength'), $('#password-strength-label'));

    $form.on('submit', function (e) {
      e.preventDefault();
      var result = App.validate.form($form, rules);
      if (!result.valid) return;

      var $btn = $form.find('button[type="submit"]');
      // The client never sends role or is_active; the backend assigns them.
      var body = {
        full_name: $.trim(result.values.full_name),
        email: $.trim(result.values.email),
        password: result.values.password,
      };

      App.ui.withLoading($btn, App.api.post('/auth/signup', body, { inline: true }))
        .done(function () {
          App.flash.set('Account created. Please sign in.', 'success');
          window.location.href = App.pageUrl('login');
        })
        .fail(function (err) {
          if (err.status === 409) {
            App.validate.showError($('#email'), 'Email already in use');
            $('#email').trigger('focus');
            return;
          }
          if (err.status === 400) {
            if (!(Array.isArray(err.data) && App.validate.showServerErrors($form, err.data))) {
              // Backend password policy errors arrive as a plain message.
              App.validate.showError($('#password'), err.message);
            }
            return;
          }
          App.toast.error(err.message);
        });
    });
  }

  function initLogin() {
    var $form = $('#login-form');
    if (!$form.length) return;

    var $error = $('#login-error');
    var rules = {
      email: [
        function (v) { return App.validate.required(v) ? '' : 'Email is required.'; },
        function (v) { return App.validate.email(v) ? '' : 'Enter a valid email address.'; },
      ],
      password: [function (v) { return App.validate.required(v) ? '' : 'Password is required.'; }],
    };

    App.validate.bindLive($form, rules);

    $form.on('submit', function (e) {
      e.preventDefault();
      // The form-level error is cleared on every new attempt.
      $error.prop('hidden', true).text('');

      var result = App.validate.form($form, rules);
      if (!result.valid) return;

      var $btn = $form.find('button[type="submit"]');
      var remember = $('#remember').is(':checked');
      var body = { email: $.trim(result.values.email), password: result.values.password };

      App.ui.withLoading($btn, App.api.post('/auth/login', body, { inline: true }))
        .done(function (data) {
          var user = data && data.user;
          if (!data || !data.token || !user) {
            $error.text('Something went wrong. Please try again.').prop('hidden', false);
            return;
          }
          App.auth.setSession(data.token, user, remember);
          /* ROLE GUARD: where to go after sign in depends on the role returned by the
             backend. landingPage() sends admins to the admin dashboard and regular
             users to their own dashboard. The backend still enforces access on every request. */
          window.location.href = App.pageUrl(App.auth.landingPage(user.role));
        })
        .fail(function (err) {
          if (err.status === 401 || err.status === 400) {
            // Never reveal which field was wrong.
            $error.text('Invalid credentials').prop('hidden', false);
            return;
          }
          App.toast.error(err.message);
        });
    });
  }

  function initNotFound() {
    $('#go-back').on('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = App.pageUrl('events');
    });
  }

  $(function () {
    initSignup();
    initLogin();
    initNotFound();
  });
})();
