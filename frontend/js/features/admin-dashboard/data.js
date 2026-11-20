(function ($) {
  window.App = window.App || {};
  App.adminDashboard = App.adminDashboard || {};

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

  App.adminDashboard.data = { num: num, growthSeries: growthSeries };
})(jQuery);
