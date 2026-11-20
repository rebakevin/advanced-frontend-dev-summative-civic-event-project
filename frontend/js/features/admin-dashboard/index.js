/* ROLE GUARD: admin only. This page shows platform-wide statistics, so guard.js redirects
   non-admins to the forbidden page; the backend enforces the same on GET /dashboard/admin. */
(function ($) {
  window.App = window.App || {};

  function bindToggle(btnId, wrapId, chartWrapId) {
    $(btnId).on('click', function () {
      var $btn = $(this);
      var showTable = $btn.attr('aria-expanded') !== 'true';
      $btn.attr('aria-expanded', String(showTable)).text(showTable ? 'View as chart' : 'View as table');
      $(wrapId).prop('hidden', !showTable);
      if (window.Chart) $(chartWrapId).prop('hidden', showTable);
    });
  }

  function initAdminDashboard() {
    var $content = $('#dash-content');
    if (!$content.length) return;

    // Shared state for the parts in App.adminDashboard.
    var ctx = {
      $content: $content,
      $state: $('#dash-state'),
      $refresh: $('#dash-refresh'),
      $updated: $('#dash-updated'),
      charts: { growth: null, events: null },
      reduced: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };

    bindToggle('#growth-toggle', '#growth-table-wrap', '#growth-chart-wrap');
    bindToggle('#events-toggle', '#events-table-wrap', '#events-chart-wrap');
    ctx.$refresh.on('click', function () { App.adminDashboard.render.load(ctx, true); });

    App.adminDashboard.render.load(ctx, false);
  }

  $(function () {
    initAdminDashboard();
  });
})(jQuery);
