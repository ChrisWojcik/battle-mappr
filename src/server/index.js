const http = require('http');
const path = require('path');
const express = require('express');
const compression = require('compression');
const ShareDB = require('sharedb');
const ShareDBMongo = require('sharedb-mongo');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');

const sharedb = new ShareDB({
  db: ShareDBMongo(process.env.MONGODB_CONNECTION, {
    useUnifiedTopology: true,
  }),
});

createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
  const connection = sharedb.connect();
  const doc = connection.get('boards', 'test');

  doc.fetch(function (err) {
    if (err) throw err;

    if (doc.type === null) {
      doc.create({ drawing: [] }, callback);
      return;
    }
    callback();
  });
}

function startServer() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(compression());

  app.use(
    '/js',
    express.static(path.join(__dirname, '..', '..', '.build', 'js'))
  );
  app.use(
    '/css',
    express.static(path.join(__dirname, '..', '..', '.build', 'css'))
  );
  app.use(
    '/img',
    express.static(path.join(__dirname, '..', '..', '.build', 'img'))
  );

  app.get('/', (req, res) => {
    res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.render('index');
  });

  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    const stream = new WebSocketJSONStream(ws);
    sharedb.listen(stream);
  });

  server.listen(process.env.PORT, (err) => {
    if (err) {
      throw err;
    }

    console.log(`Server listening on port ${process.env.PORT}`);
  });
}
