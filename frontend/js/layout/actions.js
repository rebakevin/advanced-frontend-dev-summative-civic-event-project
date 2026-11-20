(function () {
  window.App = window.App || {};
  var L = (App.layoutInternal = App.layoutInternal || {});

  L.initSearch = function () {
    var $form = $('#header-search');
    if (!$form.length) return;
    $form.on('submit', function (e) {
      // Empty searches go to the plain events list instead of ?q=.
      var q = $.trim($form.find('input[name="q"]').val());
      if (!q) {
        e.preventDefault();
        window.location.href = App.pageUrl('events');
      }
    });
    // Pre-fill from the current ?q= so the box reflects the active search.
    var current = new URLSearchParams(window.location.search).get('q');
    if (current) $form.find('input[name="q"]').val(current);
  };

  L.initLogout = function () {
    $('#logout-btn').on('click', function () {
      App.auth.logout();
      window.location.href = App.pageUrl('login');
    });
  };

  L.initBell = function () {
    $('#notif-bell').on('click', function () {
      // The drawer is a spec requirement, but it would only duplicate the full notifications page.
      if ($('body').data('page') === 'notifications') return;
      App.drawer.toggle();
    });
  };
})();
