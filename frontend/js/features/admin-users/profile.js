(function ($) {
  window.App = window.App || {};
  var ns = (App.adminUsersPage = App.adminUsersPage || {});

  function openProfile(user) {
    var $body = $('<div></div>');
    var $done = $('<button class="btn btn-ghost" type="button">Close</button>');
    var dialog = App.modal.open({ title: user.full_name || 'User profile', $body: $body, $footer: $done });
    $done.on('click', function () { dialog.close(); });

    function fill(u) {
      $body.empty().removeAttr('aria-busy');
      var $dl = $('<dl class="grid gap-3"></dl>').appendTo($body);
      function row(label, value) {
        var $r = $('<div></div>').appendTo($dl);
        $('<dt class="text-sm text-muted"></dt>').text(label).appendTo($r);
        var $dd = $('<dd class="m-0"></dd>').appendTo($r);
        if (value && value.jquery) $dd.append(value); else $dd.text(value || '');
      }
      row('Name', u.full_name);
      row('Email', u.email);
      row('Role', ns.roleBadge(u.role));
      row('Status', ns.statusBadge(u.is_active));
      row('Created', App.events.formatDateTime(u.created_at));
      row('Last updated', App.events.formatDateTime(u.updated_at));
    }
    function load() {
      App.skeleton.show($body, { count: 3, type: 'line' });
      App.api.get('/users/' + encodeURIComponent(user.id), null, { inline: true })
        .done(fill)
        .fail(function (err) {
          App.skeleton.error($body, { message: err && err.message, onRetry: load });
        });
    }
    load();
  }

  ns.openProfile = openProfile;
})(jQuery);
