// Routes for socket.io
var uuid = require('node-uuid');
var request = require('request');
var fs = require('fs');
var path = require('path');
var queue = require('../lib/queue');
var crypt = require('crypto');

var User = require('../models/user');

var available_workers = [];

var workers_total = 0;

var pbkdf2_source = fs.readFileSync(path.join(__dirname, '..', 'resources', 'pbkdf2.js'), 'utf-8');
var pbkdf2_rounds = 1000;
var speed_test_source = (
"var i, res = [];\n" +
"var pbkdf2 = (function(input) { \n" + pbkdf2_source + "\n });" +
"for (i = 0; i < input.inputs.length; i++) {\n"+
"  res.push(pbkdf2({password:input.inputs[i].password, "+
"     salt:input.inputs[i].salt, num_iterations: input.num_iterations}));"+
"}\n"+
"console.log(res); return {'outputs': res};"
);
var speed_test_inputs = 25;
var speed_test_checks = 5;

function getPassSaltList() {
  var res = [], i;
  for (i = 0; i < speed_test_inputs; i++) {
    res.push({password: uuid.v4(), salt: uuid.v4()});
  }
  return res;
}

function PBKDF2(pass, salt, cb) {
  crypt.pbkdf2(pass, salt, pbkdf2_rounds, 256, cb);
}

function verifyPBKDF2(inputs, o, done) {
  var i;
  if (inputs.length != o.length) { return done(false); }

  var f = function(i) {
    var r = Math.floor(Math.random() * o.length);
    PBKDF2(inputs[r].password, inputs[r].salt, function(err, x) {
      if (o[r] != x.toString('hex')) {
        done(false);
      } else {
        i++;
        if (i < speed_test_checks) {
          f(i);
        } else {
          done(true);
        }
      }
    });
  };

  f(0);
}

// Serve a task on the request if one is available to serve
function serve_task(req) {
  if (typeof(req.io.socket._speed) === "undefined") {
    req.io.socket._speed_inputs = getPassSaltList();
    req.io.socket._speed_start = (new Date()).getTime();
    req.io.emit('do-task', {
      'url': 'speed-test',
      'uuid': uuid.v4(),
      'script': speed_test_source,
      'input': JSON.stringify({
        num_iterations: pbkdf2_rounds,
        inputs: req.io.socket._speed_inputs
      })
    });
    return;
  }

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
    if (req.session.passport && req.session.passport.user) {
      io.join('balance-' + req.session.passport.user);
    }
    app.io.room('num-clients').broadcast('num-clients-update', {num: workers_total});
    io.socket.on('disconnect', function(e) {
      workers_total--;
      app.io.room('num-clients').broadcast('num-clients-update', {num: workers_total});
    });
  });
  app.io.route("listen-deploy", function(req) {
     var io = req.io;
     if (req.session.passport && req.session.passport.user) {
       io.join('deploy-' + req.session.passport.user);
     }
  });
  // handle errors on the socket now.
  // save the last task sent as req.io._last_task

  app.io.route('task-done', function(req) {
    console.log(req.data);
    if (req.data.url === 'speed-test') {
      verifyPBKDF2(req.io.socket._speed_inputs, req.data.result.outputs, function(correct) {
        if (!correct) {
          console.log("CHEATER!!!!!");
          req.io.disconnect();
        } else {
          var diff = (new Date()).getTime() - req.io.socket._speed_start;
          req.io.socket._speed = 1.0/diff;
        }
      });
    } else if (req.data.url) {
      request.post(
        req.data.url,
        { json: req.data},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
          }
      });
    }
    req.io._last_task = null;
    serve_task(req);
  });

  app.io.route('task-killed', function(req) {
    req.io._last_task = null;
    console.log(JSON.stringify(req.data));
  });

  app.io.route('mining-sync', function(req) {
    if (req.session.passport && req.session.passport.user) {
      User.findById(req.session.passport.user, function(err, user) {
        user.bitCoin += req.data.work_time / 50 *  0.00104729 / 1000;
        user.save();
        app.io.room('balance-' + req.session.passport.user).broadcast('balance-sync', {bitcoin: user.bitCoin});
      });
    }
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
