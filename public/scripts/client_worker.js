importScripts('/socket.io/socket.io.js')
importScripts('/scripts/client_worker_inner.js');

function postJSON(event, data) {
  postMessage(JSON.stringify({'event': event, 'data': data}));
}

io = io.connect();

initClient(io, postJSON);
