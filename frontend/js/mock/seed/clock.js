(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  var DAY = 24 * 60 * 60 * 1000;
  var HOUR = 60 * 60 * 1000;

  // Date and media helpers for one seed run. Dates stay relative to "now".
  App.mock.internal.seed.helpers = function (now) {
    // Offset in days (can be fractional) from now, as an ISO string.
    function at(days) {
      return new Date(now + days * DAY).toISOString();
    }

    // Start and end of an event: `days` from now at `hour` o'clock, lasting `hours`.
    function slot(days, hour, hours) {
      var start = new Date(now + days * DAY);
      start.setHours(hour, 0, 0, 0);
      return { starts_at: start.toISOString(), ends_at: new Date(start.getTime() + hours * HOUR).toISOString() };
    }

    function image(file) { return App.mock.assetUrl('assets/demo/' + file); }
    function audio() { return App.mock.assetUrl('assets/demo/sample-audio.wav'); }
    function video() { return App.mock.assetUrl('assets/demo/sample-video.mp4'); }

    return { at: at, slot: slot, image: image, audio: audio, video: video };
  };
})();
