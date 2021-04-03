# Battle Mappr

[http://battlemappr.herokuapp.com/](http://battlemappr.herokuapp.com/)

A canvas app for collaboratively drawing battle maps (e.g. for DnD sessions) over websockets.

## Built with:

- [ShareDB](https://github.com/share/sharedb) - Operational Transforms for eventual consistency

## Local Development

ShareDB's ops and snapshots are persisted with [mongodb](https://www.mongodb.com/) via an [adapter](https://github.com/share/sharedb-mongo). You will need a working `mongodb` database connection. Install mongodb locally (e.g. [on macOS via homebrew](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)) or use another solution such as a cloud service provider.

Following the pattern in the `.env.example` file, create a `.env` file in the project root and add your connection information as an environment variable. These will be loaded in the server-side environment using `dotenv`.

**Install project dependencies:**

```
npm install
```

**Start the app:**

```
npm run dev
```

This command will:

- Start up the backend server with `nodemon`.
- Build the frontend with webpack in watch mode.

The project will now be available a `http://localhost:3000`.

## Deployment

The project is currently deployed to heroku.
