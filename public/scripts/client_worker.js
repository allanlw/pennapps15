importScripts('/socket.io/socket.io.js')

function postJSON(event, data) {
  postMessage(JSON.stringify({'event': event, 'data': data}));
}

io = io.connect();

io.emit('ready');

postJSON('ready');

io.on('do-task', function(data) {
  console.log(data);
  postJSON('do-task', data);

  var input = JSON.parse(data.input);

  var f = new Function("input", data.script);
  var result = f(input);


  var ro = {"uuid": data.uuid, "result": result};
  postJSON('task-done', ro);
  io.emit('task-done', ro);
});
