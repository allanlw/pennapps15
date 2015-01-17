// This is a simple queue module
// It hides the actual queue, and the exports just have
// enqueue, dequeue, size and EventEmitter methods
// useful for .on('enqueue') response to events getting queued, etc

var events = require("events");

var queue = [];

module.exports = new events.EventEmitter();

module.exports.enqueue = function(x) {
  queue.push(x);
  this.emit('enqueue', x);
}

module.exports.dequeue = function() {
  var r = queue.shift();
  this.emit("dequeue", r);
  return r;
}

module.exports.size = function() {
  return queue.length;
}
