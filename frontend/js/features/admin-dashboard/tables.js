(function ($) {
  window.App = window.App || {};
  App.adminDashboard = App.adminDashboard || {};

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

  App.adminDashboard.tables = { fillCards: fillCards, fillTable: fillTable };
})(jQuery);
