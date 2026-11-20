(function ($) {
  window.App = window.App || {};
  var ns = (App.adminUsersPage = App.adminUsersPage || {});

  function statusBadge(active) {
    return $('<span class="badge"></span>')
      .addClass(active ? 'badge-green' : 'badge-red').text(active ? 'Active' : 'Disabled');
  }

  function roleBadge(role) {
    return $('<span class="badge"></span>').addClass(role === 'admin' ? 'badge-blue' : 'badge-draft').text(role || '');
  }

  function applyStatus($row, user) {
    $row.find('.user-status').empty().append(statusBadge(user.is_active));
    $row.find('.user-toggle').text(user.is_active ? 'Disable' : 'Enable')
      .toggleClass('btn-danger', !!user.is_active).toggleClass('btn-primary', !user.is_active)
      .attr('aria-label', (user.is_active ? 'Disable ' : 'Enable ') + user.full_name);
  }

  ns.statusBadge = statusBadge;
  ns.roleBadge = roleBadge;
  ns.applyStatus = applyStatus;
})(jQuery);
