(function ($) {
  window.App = window.App || {};
  var ns = (App.adminUsersPage = App.adminUsersPage || {});

  // Shared state of the users page. index.js fills it in when the page starts.
  ns.state = {
    $list: null,
    $pagination: null,
    page: 1,
    myId: null,
  };

  function toggleUser(user, $tr, $toggle) {
    var disabling = !!user.is_active;
    App.modal.confirm({
      title: disabling ? 'Disable user?' : 'Enable user?',
      message: disabling
        ? user.full_name + ' will no longer be able to sign in.'
        : user.full_name + ' will be able to sign in again.',
      confirmLabel: disabling ? 'Disable' : 'Enable',
      danger: disabling,
    }).done(function () {
      var req = App.api.patch('/users/' + encodeURIComponent(user.id) + (disabling ? '/disable' : '/enable'), null, { inline: true });
      App.ui.withLoading($toggle, req).done(function () {
        user.is_active = !disabling;
        ns.applyStatus($tr, user);
        App.toast.success(user.full_name + (disabling ? ' disabled.' : ' enabled.'));
      });
    });
  }

  function buildRow(user) {
    var $tr = $('<tr></tr>');
    $('<td></td>').text(user.full_name).appendTo($tr);
    $('<td></td>').text(user.email).appendTo($tr);
    $('<td></td>').append(ns.roleBadge(user.role)).appendTo($tr);
    $('<td class="user-status"></td>').appendTo($tr);
    $('<td></td>').text(App.events.formatDate(user.created_at)).appendTo($tr);
    var $actions = $('<td class="table-actions"></td>').appendTo($tr);

    var $view = $('<button class="btn btn-sm btn-ghost" type="button"></button>')
      .attr('aria-label', 'View profile of ' + user.full_name).text('View profile').appendTo($actions);
    $view.on('click', function () { ns.openProfile(user); });

    /* ROLE GUARD: admin only. Enable/disable changes account access; the backend enforces the role.
       The signed-in admin cannot disable their own account. */
    var $toggle = $('<button class="btn btn-sm user-toggle" type="button"></button>').appendTo($actions);
    ns.applyStatus($tr, user);
    if (String(user.id) === String(ns.state.myId)) {
      $toggle.prop('disabled', true);
      $('<span class="text-sm text-muted"></span>').attr('id', 'user-self-' + user.id)
        .text('This is your account.').appendTo($actions);
      $toggle.attr('aria-describedby', 'user-self-' + user.id);
    } else {
      $toggle.on('click', function () { toggleUser(user, $tr, $toggle); });
    }
    return $tr;
  }

  ns.buildRow = buildRow;
})(jQuery);
