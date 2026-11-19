(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  var PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  // Same loose check as express-validator's isEmail for ordinary addresses.
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function isBlank(v) {
    return v === undefined || v === null || String(v) === '';
  }

  function isEmail(v) {
    return typeof v === 'string' && EMAIL_REGEX.test(v);
  }

  // Public shape: never includes the password.
  function publicUser(u) {
    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  }

  function brief(u) {
    return { id: u.id, full_name: u.full_name, email: u.email, role: u.role };
  }

  function findByEmail(email) {
    var users = App.mock.db.get().users;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) return users[i];
    }
    return null;
  }

  function validation(errors) {
    return App.mock.error(400, 'Validation failed', errors);
  }

  // POST /auth/signup
  App.mock.route('POST', '/auth/signup', function (req) {
    var b = req.body || {};
    var errors = [];
    if (isBlank(b.full_name)) errors.push({ field: 'full_name', message: 'Full name is required' });
    if (!isEmail(b.email)) errors.push({ field: 'email', message: 'Valid email is required' });
    if (typeof b.password !== 'string' || b.password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }
    if (errors.length) throw validation(errors);

    if (!PASSWORD_REGEX.test(b.password)) {
      throw App.mock.error(400, 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
    }
    if (findByEmail(b.email)) throw App.mock.error(409, 'Email already in use');

    var stamp = App.mock.now();
    var user = {
      id: App.mock.db.nextId('users'),
      full_name: b.full_name,
      email: b.email,
      password: b.password,
      role: 'user',
      is_active: true,
      created_at: stamp,
      updated_at: stamp,
    };
    App.mock.db.get().users.push(user);
    return App.mock.ok({ id: user.id, full_name: user.full_name, email: user.email, role: user.role }, 'User created successfully', 201);
  });

  // POST /auth/login
  App.mock.route('POST', '/auth/login', function (req) {
    var b = req.body || {};
    var errors = [];
    if (!isEmail(b.email)) errors.push({ field: 'email', message: 'Valid email is required' });
    if (isBlank(b.password)) errors.push({ field: 'password', message: 'Password is required' });
    if (errors.length) throw validation(errors);

    var user = findByEmail(b.email);
    if (!user || user.password !== b.password) throw App.mock.error(401, 'Invalid credentials');
    // Backend quirk: login does not check is_active, so disabled users can still sign in.
    return App.mock.ok({ token: App.mock.makeToken(user), user: brief(user) }, 'Login successful');
  });

  // GET /users (admin): plain array, newest first, page/limit slicing (no pagination wrapper).
  App.mock.route('GET', '/users', function (req) {
    App.mock.requireAdmin(req);
    var rows = App.mock.sortNewest(App.mock.db.get().users.slice());
    var items = App.mock.paginate(rows, req.query).items;
    return App.mock.ok(items.map(publicUser), 'Users retrieved successfully');
  });

  // GET /users/profile/me
  App.mock.route('GET', '/users/profile/me', function (req) {
    var me = App.mock.requireUser(req);
    return App.mock.ok(publicUser(me), 'User profile retrieved successfully');
  });

  // PATCH /users/profile/me
  App.mock.route('PATCH', '/users/profile/me', function (req) {
    var me = App.mock.requireUser(req);
    var b = req.body || {};
    var errors = [];
    if (b.full_name !== undefined && isBlank(b.full_name)) errors.push({ field: 'full_name', message: 'Full name cannot be empty' });
    if (b.email !== undefined && !isEmail(b.email)) errors.push({ field: 'email', message: 'Must be a valid email' });
    if (b.role !== undefined) errors.push({ field: 'role', message: 'Cannot update role' });
    if (b.is_active !== undefined) errors.push({ field: 'is_active', message: 'Cannot update status' });
    if (errors.length) throw validation(errors);

    if (b.email) {
      var other = findByEmail(b.email);
      if (other && other.id !== me.id) throw App.mock.error(409, 'Email is already in use');
    }
    if (b.full_name) me.full_name = b.full_name;
    if (b.email) me.email = b.email;
    me.updated_at = App.mock.now();
    return App.mock.ok(publicUser(me), 'Profile updated successfully');
  });

  // GET /users/:id (admin)
  App.mock.route('GET', '/users/:id', function (req) {
    App.mock.requireAdmin(req);
    var user = App.mock.db.require('users', req.params.id, 'User');
    return App.mock.ok(publicUser(user), 'User retrieved successfully');
  });

  function setActive(active) {
    return function (req) {
      App.mock.requireAdmin(req);
      var user = App.mock.db.require('users', req.params.id, 'User');
      user.is_active = active;
      user.updated_at = App.mock.now();
      return App.mock.ok(publicUser(user), active ? 'User enabled successfully' : 'User disabled successfully');
    };
  }

  App.mock.route('PATCH', '/users/:id/enable', setActive(true));
  App.mock.route('PATCH', '/users/:id/disable', setActive(false));
})();
