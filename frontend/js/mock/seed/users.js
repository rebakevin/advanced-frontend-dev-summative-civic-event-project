(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the users table. `c` is the helper set from clock.js.
  App.mock.internal.seed.users = function (c) {
    var at = c.at;

    function user(id, name, email, password, role, active, ageDays) {
      return {
        id: id,
        full_name: name,
        email: email,
        password: password,
        password_hash: '$2b$10$mockhashnotusedinthedemo',
        role: role,
        is_active: active,
        created_at: at(-ageDays),
        updated_at: at(-ageDays),
      };
    }

    // Users are spread over the last six months for the dashboard growth chart.
    var users = [
      user(1, 'Admin User', 'admin@civicevents.test', 'Admin#1234', 'admin', true, 170),
      user(2, 'Demo User', 'user@civicevents.test', 'User#1234', 'user', true, 140),
      user(3, 'Amina Okafor', 'amina.okafor@civicevents.test', 'User#1234', 'user', true, 105),
      user(4, 'Liam Dupont', 'liam.dupont@civicevents.test', 'User#1234', 'user', true, 72),
      user(5, 'Sofia Mensah', 'sofia.mensah@civicevents.test', 'User#1234', 'user', true, 40),
      user(6, 'Daniel Karekezi', 'daniel.karekezi@civicevents.test', 'User#1234', 'user', false, 12),
    ];

    return users;
  };
})();
