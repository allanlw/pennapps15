var clientWorker = new Worker('/scripts/client_worker.js');

clientWorker.onmessage = function(e) {
  var o = JSON.parse(e.data);
  console.log(o);
}
