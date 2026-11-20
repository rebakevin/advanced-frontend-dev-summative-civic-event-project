/* ROLE GUARD: admin only. This page is guarded by guard.js (role "admin"; users are sent to "forbidden").
   The enable/disable controls are admin-only because only admins may change account access; the backend enforces it.
   The client never sends role or is_active, and an admin cannot disable their own account here. */
(function ($) {
  window.App = window.App || {};
  var ns = (App.adminUsersPage = App.adminUsersPage || {});

  function initAdminUsers() {
    var $list = $('#users-list');
    if (!$list.length) return;
    var me = App.auth.getUser();

    ns.state.$list = $list;
    ns.state.$pagination = $('#users-pagination');
    ns.state.page = 1;
    ns.state.myId = me ? me.id : null;

    ns.load();
  }

  $(function () {
    initAdminUsers();
  });
})(jQuery);
