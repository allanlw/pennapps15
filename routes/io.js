var uuid = require('node-uuid');

function serve_task(req) {
  req.io.emit("do-task", {
    script: "var x = 0; for(i = 0, x = 0; i < input.max; i++) { x+= i*i; } return x;",
    input: JSON.stringify({max: 100000000 * Math.random()}),
    uuid: uuid.v4(),
  });
}

function add_io_routes(app) {
  app.io.route('ready', function(req) {
    serve_task(req);
  });

  app.io.route('task-done', function(req) {
    console.log(JSON.stringify(req.data));
    serve_task(req);
  });
}

module.exports = add_io_routes
