
function serve_task(req) {
  req.io.emit("do-task", {
    script: "var x = 0; for(i = 0, x = 0; i < input.max; i++) { x+= i; } return x;",
    input: JSON.stringify({max: 1000000000 * Math.random()}),
  });
}

function add_io_routes(app) {
  app.io.route('ready', function(req) {
    serve_task(req);
  });

  app.io.route('task-done', function(req) {
    serve_task(req);
  });
}

module.exports = add_io_routes
