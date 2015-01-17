// Client code for running in the browser
// Handles web worker creation as well as killing tasks that run too long
var clientWorker = null;
var task_start = null;
var current_task = null;

// 10 second timeout for development
var MAX_TIMEOUT = 10*1000;

function newTask(obj) {
  task_start = (new Date()).getTime();
  console.log("Starting task: "+ obj.uuid);
}
function taskComplete(obj) {
  var now = (new Date()).getTime();
  var duration = (now - task_start)/1000;
  if (obj.exception === null) {
    console.log("Task completed: "+ obj.uuid + " after " + duration + " seconds");
  } else {
    console.log("Task failed: "+ obj.uuid + " after " + duration + " seconds");
  }
}
function taskKilled(obj) {
  var now = (new Date()).getTime();
  var duration = (now - task_start)/1000;
  console.log("Task killed: "+ obj.uuid + " after " + duration + " seconds");
}

function workerOnMessage(e) {
  var o = JSON.parse(e.data);
  if (o.event === 'ready') {
    return;
  }

  if (o.event === 'do-task') {
    current_task = o.data.uuid;
    newTask(o.data);
    // Make sure 60 seconds from now we're executing a different task
    // if not, restart the worker.
    setTimeout(function() {
      if (current_task !== o.data.uuid) {
        return;
      }
      clientWorker.terminate();
      clientWorker = null;
      taskKilled(o.data);
      startWorker();
    }, MAX_TIMEOUT);
  } else if (o.event === 'task-done') {
    current_task = null;
    taskComplete(o.data);
  }
}

// Start the worker (kills a running worker if there already is one)
function startWorker() {
  clientWorker = new Worker('/scripts/client_worker.js');

  current_task = null;

  clientWorker.onmessage = workerOnMessage;
}

startWorker();

