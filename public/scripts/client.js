var clientWorker = null, task_start = null, current_task = null;

var MAX_TIMEOUT = 60*1000;

function workerOnMessage(e) {
  var o = JSON.parse(e.data);
  console.log(o);
  if (o.event === 'ready') {
    return;
  }

  var uuid = o.data.uuid;

  if (o.event === 'do-task') {
    task_start = (new Date()).getTime();
    current_task = uuid;
    // Make sure 60 seconds from now we're executing a different task
    // if not, restart the worker.
    setTimeout(function() {
      if (current_task !== uuid) {
        return;
      }
      startWorker();
    }, MAX_TIMEOUT);
  } else if (o.event === 'task-done') {
    var now = (new Date()).getTime();
    var duration = (now - task_start)/1000;
    console.log(duration);
    current_task = null;
  }
}

// Start the worker (kills a running worker if there already is one)
function startWorker() {
  if (clientWorker !== null) {
    clientWorker.terminate();
    clientWorker = null;
  }
  clientWorker = new Worker('/scripts/client_worker.js');

  task_start = null;
  current_task = null;

  clientWorker.onmessage = workerOnMessage;
}

startWorker();
