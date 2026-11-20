(function ($) {
  window.App = window.App || {};
  App.adminDashboard = App.adminDashboard || {};

  // Hex values mirror tailwind.config.js tokens (blue, orange-deep, ink, border).
  var COLORS = { blue: '#1F4FD8', orange: '#B03A00', ink: '#111111', grid: '#C4C6BE' };

  function drawChart(ctx, name, canvasId, config) {
    if (!window.Chart) return;
    if (ctx.charts[name]) ctx.charts[name].destroy();
    ctx.charts[name] = new window.Chart(document.getElementById(canvasId), config);
  }

  function draw(ctx, growth, upcoming, past) {
    var common = {
      responsive: true,
      maintainAspectRatio: false,
      animation: ctx.reduced ? false : { duration: 400 },
      plugins: { legend: { display: false } },
    };
    drawChart(ctx, 'growth', 'growth-chart', {
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
    drawChart(ctx, 'events', 'events-chart', {
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

  App.adminDashboard.charts = { draw: draw };
})(jQuery);
