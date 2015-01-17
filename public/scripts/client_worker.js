importScripts('/socket.io/socket.io.js')

function postJSON(event, data) {
  postMessage(JSON.stringify({'event': event, 'data': data}));
}

io = io.connect();

io.emit('ready');

postJSON('ready');

io.on('do-task', function(data) {
  postJSON('do-task', data);

  var input = JSON.parse(data.input);

  var result = null, exc = null;
  try {
    result = (new Function("input", data.script))(input);
  } catch(e) {
    exc = e;
  }

  var ro = {"uuid": data.uuid, "result": result, "exception": exc};
  postJSON('task-done', ro);
  io.emit('task-done', ro);
});
