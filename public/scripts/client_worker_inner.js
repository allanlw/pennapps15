// Inner script that is shared between node version of
// client and the webworker version of the client
function initClient(io, postJSON) {
  io.emit('ready');

  postJSON('ready');

  io.on('do-task', function(data) {
    postJSON('do-task', data);

    var input = JSON.parse(data.input);

    var result = null, exc = null;
    try {
      result = (new Function("input", data.script))(input);
    } catch(e) {
      exc = "" + e;
      console.log(exc);
    }

    var ro = {"uuid": data.uuid, "result": result, "url": data.url ,"exception": exc};
    postJSON('task-done', ro);
    io.emit('task-done', ro);
  });
}

if (typeof(module) !== "undefined") {
  module.exports = initClient;
}
