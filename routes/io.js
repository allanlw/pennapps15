var uuid = require('node-uuid');

var queue = require('../lib/queue');

var available_workers = [];

function serve_task(req) {
  if (queue.size() === 0) {
    available_workers.push(req.io);
    console.log(available_workers.length + " free workers");
  } else {
    req.io.emit("do-task", queue.dequeue());
  }
}

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

queue.on("enqueue", function(x) {
  if (available_workers.length > 0) {
    available_workers.shift().emit("do-task", queue.dequeue());
  } else {
    console.log(queue.size() + " queued jobs");
  }
});

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
