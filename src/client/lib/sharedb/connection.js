import ReconnectingWebSocket from 'reconnecting-websocket';
import sharedb from 'sharedb/lib/client';

// Open WebSocket connection to ShareDB server
const socket = new ReconnectingWebSocket('ws://' + window.location.host);
const connection = new sharedb.Connection(socket);

export default connection;
