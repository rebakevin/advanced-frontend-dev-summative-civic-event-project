// Demo mode only: shows the demo accounts on the login page and adds a "Reset demo data" link to the footer.
(function ($) {
  window.App = window.App || {};

  function buildCredentials($box, accounts) {
    var $card = $('<div class="card card-pad mb-4"></div>');
    $card.append($('<h2 class="mb-2 text-lg"></h2>').text('Demo mode'));
    $card.append($('<p class="mb-3 text-sm text-muted"></p>').text('Use one of these accounts, or press Fill in.'));

    var $table = $('<table class="table table-compact"></table>');
    var $head = $('<tr></tr>');
    ['Role', 'Email', 'Password', ''].forEach(function (label) {
      $head.append($('<th scope="col"></th>').text(label));
    });
    $table.append($('<thead></thead>').append($head));

    var $body = $('<tbody></tbody>');
    accounts.forEach(function (account) {
      var $row = $('<tr></tr>');
      $row.append($('<td></td>').text(account.role));
      $row.append($('<td></td>').text(account.email));
      $row.append($('<td></td>').text(account.password));
      var $fill = $('<button type="button" class="btn btn-ghost btn-sm"></button>')
        .text('Fill in')
        .attr('aria-label', 'Fill in ' + account.role + ' account')
        .on('click', function () {
          $('#email').val(account.email).trigger('input');
          $('#password').val(account.password).trigger('input');
          $('#password').trigger('focus');
        });
      $row.append($('<td class="table-actions"></td>').append($fill));
      $body.append($row);
    });
    $table.append($body);

    $card.append($('<div class="table-wrap"></div>').append($table));
    $box.empty().append($card).prop('hidden', false);
  }

  function addResetLink() {
    var $copy = $('.site-footer .footer-copy').first();
    if (!$copy.length) return;
    var $reset = $('<button type="button" class="btn-link"></button>')
      .text('Reset demo data')
      .on('click', function () {
        App.mock.db.reset();
        App.auth.logout();
        window.location.href = App.pageUrl('login');
      });
    $copy.append(document.createTextNode(' ')).append($reset);
  }

  $(function () {
    var accounts = (App.mock && App.mock.demoAccounts) || [];
    var $box = $('#demo-credentials');
    if ($('body').attr('data-page') === 'login' && $box.length && accounts.length) {
      buildCredentials($box, accounts);
    }
    addResetLink();
  });
})(jQuery);
