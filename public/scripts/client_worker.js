// Actual web worker script for running a client.
// Connects to socket.io and runs the common core client code
importScripts('/socket.io/socket.io.js')
importScripts('/scripts/client_worker_inner.js');

function postJSON(event, data) {
  postMessage(JSON.stringify({'event': event, 'data': data}));
}

initClient(io.connect(), postJSON);
