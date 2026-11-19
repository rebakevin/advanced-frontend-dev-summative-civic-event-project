(function ($) {
  window.App = window.App || {};

  var PAGE_SIZE = 10;
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function initNotifications() {
    var $root = $('#notifications-root');
    if (!$root.length) return;

    var $title = $('#notifications-title');
    var $markAll = $('#notifications-mark-all');
    var $pagination = $('#notifications-pagination');
    var $back = $('#notifications-back');
    var rawId = new URLSearchParams(window.location.search).get('id');

    if (rawId !== null) {
      initDetail(rawId);
    } else {
      initList();
    }

    // ---- List mode ----

    function initList() {
      var page = 1;
      var items = [];

      function renderPagination(pages) {
        $pagination.empty();
        if (pages <= 1) {
          $pagination.prop('hidden', true);
          return;
        }
        $pagination.prop('hidden', false);
        function btn(label, target, extra) {
          var $b = $('<button class="page-btn" type="button"></button>').text(label).appendTo($pagination);
          if (extra && extra.ariaLabel) $b.attr('aria-label', extra.ariaLabel);
          if (extra && extra.current) $b.attr('aria-current', 'page');
          if (extra && extra.disabled) $b.prop('disabled', true);
          $b.on('click', function () {
            page = target;
            render();
            $title[0].scrollIntoView();
          });
        }
        btn('Prev', page - 1, { disabled: page <= 1, ariaLabel: 'Previous page' });
        for (var i = 1; i <= pages; i++) {
          btn(String(i), i, { current: i === page, ariaLabel: 'Page ' + i });
        }
        btn('Next', page + 1, { disabled: page >= pages, ariaLabel: 'Next page' });
      }

      function paintMarkAll() {
        $markAll.prop('hidden', !items.length || App.notifications.unreadCount(items) === 0);
      }

      function render() {
        if (!items.length) {
          $markAll.prop('hidden', true);
          $pagination.prop('hidden', true).empty();
          App.skeleton.empty($root, {
            title: 'No notifications yet',
            text: 'New event, announcement and promo updates will show up here.',
          });
          return;
        }
        var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
        if (page > pages) page = pages;
        $root.removeAttr('aria-busy').empty();
        var $list = $('<ul class="flex flex-col"></ul>').appendTo($root);
        $.each(items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), function (i, n) {
          var $li = $('<li></li>').appendTo($list);
          var $link = $('<a class="drawer-notif"></a>')
            .attr('href', App.pageUrl('notifications', { id: n.id }))
            .data('id', n.id).appendTo($li);
          App.notifications.buildRow(n).appendTo($link);
        });
        paintMarkAll();
        renderPagination(pages);
      }

      function load() {
        $markAll.prop('hidden', true);
        $pagination.prop('hidden', true).empty();
        App.skeleton.show($root, { count: 5, type: 'row' });
        App.notifications.load({ force: true, inline: true })
          .done(function (list) {
            items = list;
            render();
          })
          .fail(function (err) {
            App.skeleton.error($root, { message: err && err.message, onRetry: load });
          });
      }

      $markAll.on('click', function () {
        if (App.notifications.markAllRead()) {
          App.toast.success('All notifications marked as read.');
        }
        render();
      });

      $root.on('click', '.drawer-notif', function () {
        App.notifications.markRead($(this).data('id'));
      });

      load();
    }

    // ---- Detail mode ----

    function initDetail(id) {
      $back.prop('hidden', false);
      $markAll.remove();
      $pagination.remove();

      function showNotFound() {
        $title.text('Notification');
        App.skeleton.empty($root, {
          title: 'Notification not found',
          text: 'It may have been removed, or the link is incorrect.',
          actionLabel: 'Back to notifications',
          href: App.pageUrl('notifications'),
        });
      }

      function buildDetail(n) {
        var $card = $('<article class="card"></article>');
        var $body = $('<div class="card-body gap-4 p-6"></div>').appendTo($card);
        $('<span class="badge badge-blue self-start"></span>').text(App.notifications.typeLabel(n.type)).appendTo($body);
        $('<p class="whitespace-pre-line"></p>').text(n.message || '').appendTo($body);
        $('<p class="card-meta"></p>').text(App.events.formatDateTime(n.created_at)).appendTo($body);
        var link = App.notifications.relatedLink(n);
        if (link) {
          var $actions = $('<div class="flex flex-wrap items-center gap-3"></div>').appendTo($body);
          $('<a class="btn btn-primary"></a>').attr('href', link.href).text(link.label).appendTo($actions);
        }
        return $card;
      }

      function load() {
        if (!UUID.test(id)) {
          showNotFound();
          return;
        }
        App.skeleton.show($root, { count: 1 });
        App.api.get('/notifications/' + id, null, { inline: true })
          .done(function (n) {
            if (!n) {
              showNotFound();
              return;
            }
            $title.text(n.title);
            $root.empty().removeAttr('aria-busy').append(buildDetail(n));
            document.title = n.title + ' | ' + document.title;
            App.notifications.markRead(n.id);
          })
          .fail(function (err) {
            if (err && err.status === 404) {
              showNotFound();
              return;
            }
            App.skeleton.error($root, { message: err && err.message, onRetry: load });
          });
      }

      load();
    }
  }

  $(function () {
    initNotifications();
  });
})(jQuery);
