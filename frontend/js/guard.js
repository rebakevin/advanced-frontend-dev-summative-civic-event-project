(function () {
  window.App = window.App || {};

  function redirect(page) {
    window.location.replace(App.pageUrl(page));
  }

  /* ROLE GUARD: control guard. Elements marked data-role="admin" (create/edit/delete
     buttons, admin links) are for admins only. They are removed from the DOM for
     everyone else, not just hidden, so a user cannot reveal them. This is a UX
     measure only; the backend enforces the real permission on every request. */
  function applyControlGuard(root) {
    if (App.auth.hasRole('admin')) return;
    $(root || document).find('[data-role="admin"]').remove();
    if (root && $(root).is('[data-role="admin"]')) $(root).remove();
  }

  // Returns true when it redirected.
  function run() {
    var mode = $('body').attr('data-guard') || 'public';

    /* ROLE GUARD: page guard. Public pages (forbidden, not-found) need no session.
       Guest pages (login, signup) are for signed-out visitors only, so a signed-in
       user is sent to the landing page for their role. Every other page requires a
       signed-in user with an unexpired token: no token goes to login, an expired
       token signs the user out first and explains why. */
    if (mode === 'public') return false;

    if (mode === 'guest') {
      if (App.auth.isLoggedIn()) {
        redirect(App.auth.landingPage(App.auth.getUser().role));
        return true;
      }
      return false;
    }

    if (!App.auth.getToken()) {
      redirect('login');
      return true;
    }

    if (App.auth.isExpired()) {
      App.auth.logout();
      App.flash.set('Your session expired. Please sign in again.', 'error');
      redirect('login');
      return true;
    }

    /* ROLE GUARD: role-vs-page check. Pages marked data-guard="admin" (admin
       dashboard, users, notifications management, create/edit forms) are for
       admins only. A signed-in normal user is sent to the forbidden page. Pages
       marked "user" allow any signed-in role, admins included. */
    if (mode === 'admin' && !App.auth.hasRole('admin')) {
      redirect('forbidden');
      return true;
    }

    applyControlGuard(document);
    return false;
  }

  App.guard = {
    run: run,
    applyControlGuard: applyControlGuard,
    redirected: false
  };

  $(function () {
    App.guard.redirected = run();
  });
})();
