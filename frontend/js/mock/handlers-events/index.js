// Mock API: /events, /event-registrations and /event-feedback. Registers the routes in the original order.
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  App.mock.internal.eventsRoutes.register();
  App.mock.internal.eventRegistrationRoutes.register();
  App.mock.internal.eventFeedbackRoutes.register();
})();
