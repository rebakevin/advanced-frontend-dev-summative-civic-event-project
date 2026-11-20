(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  // Sample media used when an upload is not stored (see assets/demo/).
  var FALLBACK_BY_FIELD = {
    image_url: 'assets/demo/sample-event.svg',
    audio_url: 'assets/demo/sample-audio.wav',
    video_url: 'assets/demo/sample-video.mp4',
  };

  // Site root as an absolute URL, so media paths work under a GitHub Pages subpath.
  function root() {
    var meta = document.querySelector('meta[name="app-root"]');
    var url = new URL(meta ? meta.content : './', window.location.href).href;
    return url.charAt(url.length - 1) === '/' ? url : url + '/';
  }

  function assetUrl(path) {
    return root() + String(path).replace(/^\/+/, '');
  }

  // blob: URLs die with the page, so a reload swaps them for the sample media
  // (also inside metadata, where events keep their image).
  function sanitize(obj) {
    Object.keys(obj).forEach(function (key) {
      var value = obj[key];
      if (typeof value === 'string' && value.indexOf('blob:') === 0 && FALLBACK_BY_FIELD[key]) {
        obj[key] = assetUrl(FALLBACK_BY_FIELD[key]);
      } else if (value && typeof value === 'object') {
        sanitize(value);
      }
    });
    return obj;
  }

  // Uploads are previewed through object URLs and not stored. `field` is image_url, audio_url or video_url.
  function fileUrl(file, field) {
    if (file && typeof file === 'object' && typeof file.size === 'number' && window.URL && URL.createObjectURL) {
      return URL.createObjectURL(file);
    }
    return assetUrl(FALLBACK_BY_FIELD[field] || '');
  }

  App.mock.internal.assetUrl = assetUrl;
  App.mock.internal.sanitize = sanitize;
  App.mock.internal.fileUrl = fileUrl;
})();
