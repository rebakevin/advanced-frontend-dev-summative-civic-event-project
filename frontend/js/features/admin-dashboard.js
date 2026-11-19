/* ROLE GUARD: admin only. This page shows platform-wide statistics, so guard.js redirects
   non-admins to the forbidden page; the backend enforces the same on GET /dashboard/admin. */
(function ($) {
  window.App = window.App || {};

  function initAdminDashboard() {
    var $content = $('#dash-content');
    if (!$content.length) return;

    var $state = $('#dash-state');
    var $refresh = $('#dash-refresh');
    var $updated = $('#dash-updated');
    var charts = { growth: null, events: null };
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Hex values mirror tailwind.config.js tokens (blue, orange-deep, ink, border).
    var COLORS = { blue: '#1F4FD8', orange: '#B03A00', ink: '#111111', grid: '#C4C6BE' };
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function num(v) {
      var n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    }

    function monthLabel(key) {
      var p = key.split('-');
      return MONTHS[num(p[1]) - 1] + ' ' + p[0];
    }

    // Last 6 calendar months (oldest first), zero-filled where the API has no row.
    function growthSeries(rows) {
      var byMonth = {};
      $.each(rows || [], function (i, r) {
        var k = String(r.month || '').slice(0, 7);
        byMonth[k] = (byMonth[k] || 0) + num(r.new_users);
      });
      var out = [];
      var now = new Date();
      for (var i = 5; i >= 0; i--) {
        var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        var key = d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1);
        out.push({ key: key, label: monthLabel(key), value: byMonth[key] || 0 });
      }
      return out;
    }

    function fillCards($grid, items) {
      $grid.empty();
      $.each(items, function (i, it) {
        var $c = $('<div class="stat"></div>');
        $('<span class="stat-n"></span>').text(it[1]).appendTo($c);
        $('<span class="stat-l"></span>').text(it[0]).appendTo($c);
        $grid.append($c);
      });
    }

    function fillTable($table, rows) {
      var $body = $table.find('tbody').empty();
      $.each(rows, function (i, r) {
        var $tr = $('<tr></tr>');
        $('<th scope="row" class="px-3.5 py-2.5 text-left font-normal"></th>').text(r[0]).appendTo($tr);
        $('<td></td>').text(r[1]).appendTo($tr);
        $body.append($tr);
      });
    }

    function drawChart(name, canvasId, config) {
      if (!window.Chart) return;
      if (charts[name]) charts[name].destroy();
      charts[name] = new window.Chart(document.getElementById(canvasId), config);
    }

    function render(data) {
      var u = data.users || {};
      var e = data.events || {};
      var upcoming = num(e.upcoming_events);
      var past = num(e.past_events);

      fillCards($('#dash-users'), [
        ['Total users', num(u.total_users)],
        ['Active users', num(u.active_users)],
        ['Inactive users', num(u.inactive_users)],
      ]);
      fillCards($('#dash-events'), [
        ['Total events', num(e.total_events)],
        ['Upcoming events', upcoming],
        ['Past events', past],
      ]);
      fillCards($('#dash-activity'), [
        ['Registrations', num((data.registrations || {}).total_registrations)],
        ['Feedback', num((data.feedbacks || {}).total_feedback)],
        ['Promos', num((data.promos || {}).total_promos)],
        ['Announcements', num((data.announcements || {}).total_announcements)],
        ['Notifications', num((data.notifications || {}).total_notifications)],
      ]);

      var growth = growthSeries(data.user_growth);
      var growthRows = $.map(growth, function (g) { return [[g.label, g.value]]; });
      var eventRows = [['Upcoming', upcoming], ['Past', past]];
      fillTable($('#growth-table'), growthRows);
      fillTable($('#events-table'), eventRows);

      var total = 0;
      $.each(growth, function (i, g) { total += g.value; });
      $('#growth-chart').attr('aria-label', 'Line chart of new users per month over the last 6 months: ' +
        $.map(growth, function (g) { return g.label + ' ' + g.value; }).join(', ') + '. Total ' + total + '.');
      $('#events-chart').attr('aria-label', 'Bar chart of events: ' + upcoming + ' upcoming, ' + past + ' past.');

      var hasChart = !!window.Chart;
      $('#growth-chart-wrap, #events-chart-wrap').prop('hidden', !hasChart);
      if (!hasChart) {
        // Chart.js missing: tables are the only view, so show them and drop the toggles.
        $('#growth-table-wrap, #events-table-wrap').prop('hidden', false);
        $('#growth-toggle, #events-toggle').prop('hidden', true);
        return;
      }

      var common = {
        responsive: true,
        maintainAspectRatio: false,
        animation: reduced ? false : { duration: 400 },
        plugins: { legend: { display: false } },
      };
      drawChart('growth', 'growth-chart', {
        type: 'line',
        data: {
          labels: $.map(growth, function (g) { return g.label; }),
          datasets: [{
            label: 'New users',
            data: $.map(growth, function (g) { return g.value; }),
            borderColor: COLORS.blue,
            backgroundColor: COLORS.blue,
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.25,
          }],
        },
        options: $.extend(true, {}, common, {
          scales: {
            x: { ticks: { color: COLORS.ink }, grid: { color: COLORS.grid } },
            y: { beginAtZero: true, ticks: { color: COLORS.ink, precision: 0 }, grid: { color: COLORS.grid },
              title: { display: true, text: 'New users', color: COLORS.ink } },
          },
        }),
      });
      drawChart('events', 'events-chart', {
        type: 'bar',
        data: {
          labels: ['Upcoming', 'Past'],
          datasets: [{
            label: 'Events',
            data: [upcoming, past],
            backgroundColor: [COLORS.blue, COLORS.orange],
            borderColor: COLORS.ink,
            borderWidth: 1,
          }],
        },
        options: $.extend(true, {}, common, {
          scales: {
            x: { ticks: { color: COLORS.ink }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: COLORS.ink, precision: 0 }, grid: { color: COLORS.grid },
              title: { display: true, text: 'Events', color: COLORS.ink } },
          },
        }),
      });
    }

    function stamp() {
      var d = new Date();
      var hh = (d.getHours() < 10 ? '0' : '') + d.getHours();
      var mm = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      $updated.text('Last updated ' + hh + ':' + mm);
    }

    function load(isRefresh) {
      var req = App.api.get('/dashboard/admin', null, { inline: true });
      if (!isRefresh) {
        $content.prop('hidden', true);
        App.skeleton.show($state, { count: 6 });
      } else {
        App.ui.withLoading($refresh, req);
      }
      req.done(function (data) {
        $state.removeAttr('aria-busy').empty();
        $content.prop('hidden', false);
        render(data || {});
        stamp();
      }).fail(function (err) {
        if (isRefresh && !$content.prop('hidden')) {
          App.toast.error((err && err.message) || 'Could not refresh the dashboard.');
          return;
        }
        $content.prop('hidden', true);
        App.skeleton.error($state, { message: err && err.message, onRetry: function () { load(false); } });
      });
    }

    function bindToggle(btnId, wrapId, chartWrapId) {
      $(btnId).on('click', function () {
        var $btn = $(this);
        var showTable = $btn.attr('aria-expanded') !== 'true';
        $btn.attr('aria-expanded', String(showTable)).text(showTable ? 'View as chart' : 'View as table');
        $(wrapId).prop('hidden', !showTable);
        if (window.Chart) $(chartWrapId).prop('hidden', showTable);
      });
    }

    bindToggle('#growth-toggle', '#growth-table-wrap', '#growth-chart-wrap');
    bindToggle('#events-toggle', '#events-table-wrap', '#events-chart-wrap');
    $refresh.on('click', function () { load(true); });

    load(false);
  }

  $(function () {
    initAdminDashboard();
  });
})(jQuery);
