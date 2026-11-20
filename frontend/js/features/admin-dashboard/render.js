(function ($) {
  window.App = window.App || {};
  App.adminDashboard = App.adminDashboard || {};

  function render(ctx, data) {
    var num = App.adminDashboard.data.num;
    var fillCards = App.adminDashboard.tables.fillCards;
    var fillTable = App.adminDashboard.tables.fillTable;
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

    var growth = App.adminDashboard.data.growthSeries(data.user_growth);
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

    App.adminDashboard.charts.draw(ctx, growth, upcoming, past);
  }

  function stamp(ctx) {
    var d = new Date();
    var hh = (d.getHours() < 10 ? '0' : '') + d.getHours();
    var mm = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    ctx.$updated.text('Last updated ' + hh + ':' + mm);
  }

  function load(ctx, isRefresh) {
    var req = App.api.get('/dashboard/admin', null, { inline: true });
    if (!isRefresh) {
      ctx.$content.prop('hidden', true);
      App.skeleton.show(ctx.$state, { count: 6 });
    } else {
      App.ui.withLoading(ctx.$refresh, req);
    }
    req.done(function (data) {
      ctx.$state.removeAttr('aria-busy').empty();
      ctx.$content.prop('hidden', false);
      render(ctx, data || {});
      stamp(ctx);
    }).fail(function (err) {
      if (isRefresh && !ctx.$content.prop('hidden')) {
        App.toast.error((err && err.message) || 'Could not refresh the dashboard.');
        return;
      }
      ctx.$content.prop('hidden', true);
      App.skeleton.error(ctx.$state, { message: err && err.message, onRetry: function () { load(ctx, false); } });
    });
  }

  App.adminDashboard.render = { render: render, stamp: stamp, load: load };
})(jQuery);
