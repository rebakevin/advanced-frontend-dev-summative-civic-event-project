# CivicEvents+

> [!IMPORTANT]
> **Please refer to [video-demo/rubric-vs-backend.md](video-demo/rubric-vs-backend.md).**
> The provided backend differs from the assignment rubric in some places. The frontend was built to work with the existing backend. No file in `/backend` was touchded as per the rubric. 
>
> **Video demo:** see [video-demo/README.md](video-demo/README.md).

I also added a mock of the UI [here](https://rebakevin.github.io/advanced-frontend-dev-summative-civic-event-project/login/) to quickly see what they UI looks like before even cloning locally.

## Prerequisites

- Node.js 18+ and npm: `node --version`
- PostgreSQL 15+ running locally: `psql --version`, `pg_isready -h localhost -p 5432`
- Python 3 (only to serve the built frontend): `python3 --version`
- Nothing should be running on port 8080 (the frontend) or 3000 (the backend) when you start the app.

## Set up the database (once)

```
createdb -U postgres -h localhost -p 5432 "civic-events-db"
psql -U postgres -d civic-events-db -h localhost -p 5432 -f backend/migrations/001_create_tables.sql
```

Values (match `backend/.env`):

- User: `postgres`
- Host: `localhost`
- Port: `5432`
- Database: `civic-events-db`
- Password: your Postgres password (psql prompts for it, `DB_PASS` in `backend/.env`)

> [!TIP]
> I added these scripts to start the whole application (frontend and backend together) in one command and stop running the app in one command.
> - `./start.sh` to start the whole app
> - `./stop.sh` to stop the app

## Run the backend

```
cd backend
npm install
npm run dev
```

## Run the frontend

```
cd frontend
npm install
npm run build
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080

## Create an admin (real backend)

Sign up in the app, then promote the account:

```
psql -U postgres -d civic-events-db -h localhost -p 5432 -c "UPDATE users SET role = 'admin' WHERE email = 'you@example.com';"
```

## Demo mode logins

Seeded automatically by `./start.sh`, and always available in a mock-mode build (`USE_MOCK=true npm run build`), such as the GitHub Pages site.

| Email                            | Password   | Role                          |
|----------------------------------|------------|-------------------------------|
| admin@civicevents.test           | Admin#1234 | admin                         |
| user@civicevents.test            | User#1234  | user                          |
| amina.okafor@civicevents.test    | User#1234  | user                          |
| liam.dupont@civicevents.test     | User#1234  | user                          |
| sofia.mensah@civicevents.test    | User#1234  | user                          |
| daniel.karekezi@civicevents.test | User#1234  | user (disabled, can't log in) |
