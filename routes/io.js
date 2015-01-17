// Routes for socket.io
var uuid = require('node-uuid');

var queue = require('../lib/queue');

var available_workers = [];

// Serve a task on the request if one is available to serve
function serve_task(req) {
  if (queue.size() === 0) {
    available_workers.push(req.io);
    console.log(available_workers.length + " free workers");
  } else {
    req.io.emit("do-task", queue.dequeue());
  }
}

queue.on("enqueue", function(x) {
  if (available_workers.length > 0) {
    available_workers.shift().emit("do-task", queue.dequeue());
  } else {
    console.log(queue.size() + " queued jobs");
  }
});

// Only exported function, adds the ready and task-done routes to the express.io app
function add_io_routes(app) {
  app.io.route('ready', function(req) {
    serve_task(req);
  });

  app.io.route('task-done', function(req) {
    console.log(JSON.stringify(req.data));
    serve_task(req);
  });

  app.io.route('task-killed', function(req) {
    console.log(JSON.stringify(req.data));
  });

  app.io.route('mining-sync', function(req) {
    console.log(JSON.stringify(req.data));
  });
}

module.exports = add_io_routes

// Testing (auto fake test case generation every 15 seconds to keep the network alive)
function addTest(io) {
  io.emit("do-task", {
    script: "var x = 0; for(i = 0, x = 0; i < input.max; i++) { x+= i*i; } return x;",
    input: JSON.stringify({max: 100000000 * Math.random()}),
    uuid: uuid.v4(),
  });
}

function testRandomlyForever() {
  if (available_workers.length > 0) {
    addTest(available_workers.shift());
  }
  // one every minuteish
  setTimeout(testRandomlyForever, Math.random() * 1000 * 15);
}

testRandomlyForever();
