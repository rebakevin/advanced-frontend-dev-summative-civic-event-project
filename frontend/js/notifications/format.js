(function ($) {
  window.App = window.App || {};
  var N = (App.notificationsInternal = App.notificationsInternal || {});

  var PREVIEW_LENGTH = 90;

  function typeLabel(type) {
    var t = String(type || 'system').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function chipClass(type) {
    var t = String(type || '').toLowerCase();
    return 'notif-chip notif-chip-' + (t === 'event' || t === 'announcement' || t === 'promo' ? t : 'system');
  }

  function preview(message) {
    var text = String(message || '');
    return text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH).replace(/\s+\S*$/, '') + '…' : text;
  }

  function timeAgo(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    var seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' h ago';
    if (seconds < 7 * 86400) return Math.floor(seconds / 86400) + ' d ago';
    return App.events.formatDate(value);
  }

  // The related resource comes from metadata (event_id, announcement_id, promo_id).
  // Returns {label, href} or null.
  function relatedLink(n) {
    var meta = n && n.metadata;
    if (!meta || typeof meta !== 'object') return null;
    if (meta.event_id) return { label: 'View event', href: App.pageUrl('event-detail', { id: meta.event_id }) };
    if (meta.announcement_id) return { label: 'View announcement', href: App.pageUrl('announcement-detail', { id: meta.announcement_id }) };
    if (meta.promo_id) return { label: 'View promo', href: App.pageUrl('promo-detail', { id: meta.promo_id }) };
    return null;
  }

  N.typeLabel = typeLabel;
  N.chipClass = chipClass;
  N.preview = preview;
  N.timeAgo = timeAgo;
  N.relatedLink = relatedLink;
})(jQuery);
