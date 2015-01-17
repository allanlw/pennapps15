var events = require("events");

var queue = [];

module.exports = new events.EventEmitter();

module.exports.enqueue = function(x) {
  queue.push(x);
  queue.emit('enqueue', x);
}

module.exports.dequeue = function() {
  var r = queue.shift();
  queue.emit("dequeue", r);
  return r;
}

module.exports.size = function() {
  return queue.length;
}
