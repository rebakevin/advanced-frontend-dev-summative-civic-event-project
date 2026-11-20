(function ($) {
  window.App = window.App || {};
  var ns = (App.promosList = App.promosList || {});

  // The thumbnail video only gets its src when the card nears the viewport.
  function loadThumb(video) {
    var src = video.getAttribute('data-src');
    if (src) {
      video.setAttribute('src', src);
      video.removeAttribute('data-src');
    }
  }

  function lazyThumb(video) {
    var state = ns.state;
    if (!('IntersectionObserver' in window)) {
      loadThumb(video);
      return;
    }
    if (!state.observer) {
      state.observer = new IntersectionObserver(function (entries) {
        $.each(entries, function (i, entry) {
          if (!entry.isIntersecting) return;
          loadThumb(entry.target);
          state.observer.unobserve(entry.target);
        });
      }, { rootMargin: '200px' });
    }
    state.observer.observe(video);
  }

  ns.lazyThumb = lazyThumb;
})(jQuery);
