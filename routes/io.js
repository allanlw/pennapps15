// Routes for socket.io
var uuid = require('node-uuid');

var queue = require('../lib/queue');

var available_workers = [];

var workers_total = 0;

// Serve a task on the request if one is available to serve
function serve_task(req) {
  if (queue.size() === 0) {
    available_workers.push(req.io);
    console.log(available_workers.length + " free workers");
    return;
  }
  var task = queue.dequeue();
  req.io.socket._last_task = task;
  req.io.emit("do-task", task);
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
  function handleClose(s) {
    var i;
    for (i = 0; i < available_workers.length; i++) {
       if (available_workers[i].socket === s) {
         console.log("removed an avilable worker");
         available_workers.splice(i, 1);
         break;
       }
    }
    if (s._last_task !== null) {
      console.log("Re-equeued lost task");
      queue.enqueue(s._last_task);
    }
    console.log("Handled disconnect");
  }
  app.io.route('ready', function(req) {
    var s = req.io.socket;
    s._last_task = null;
    s.on('disconnect', function(e) { handleClose(s); });
    serve_task(req);
  });
  app.io.route('ready-outside', function(req) {
    var io = req.io;
    workers_total++;
    io.join('num-clients');
    app.io.room('num-clients').broadcast('num-clients-update', {num: workers_total});
    io.socket.on('disconnect', function(e) {
      workers_total--;
      app.io.room('num-clients').broadcast('num-clients-update', {num: workers_total});
    });
  });
/*
  app.io.on('connection', function(s) {
    s.on('disconnect', function(e) {
      console.log(e);
      console.log(JSON.stringify(s._last_task));
    });
  });
*/
  // handle errors on the socket now.
  // save the last task sent as req.io._last_task

  app.io.route('task-done', function(req) {
    console.log(JSON.stringify(req.data));
    req.io._last_task = null;
    serve_task(req);
  });

  app.io.route('task-killed', function(req) {
    req.io._last_task = null;
    console.log(JSON.stringify(req.data));
  });

  app.io.route('mining-sync', function(req) {
    console.log(JSON.stringify(req.data));
  });
}

module.exports = add_io_routes;

// Testing (auto fake test case generation every 15 seconds to keep the network alive)
function addTest() {
  queue.enqueue({
    script: "var x = 0; for(i = 0, x = 0; i < input.max; i++) { x+= i*i; } return x;",
    input: JSON.stringify({max: 100000000 * Math.random()}),
    uuid: uuid.v4(),
  });
}

function testRandomlyForever() {
  addTest()
  console.log("Added Test");
  // one every minuteish
  setTimeout(testRandomlyForever, Math.random() * 1000 * 15);
}

setInterval(function() {
  console.log("Queue: " + queue.size()+ " available_clients: " + available_workers.length);
}, 2500);

testRandomlyForever();
