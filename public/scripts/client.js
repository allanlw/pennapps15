// Client code for running in the browser
// Handles web worker creation as well as killing tasks that run too long
var clientWorker = null, clientio = null;
var task_start = null;
var current_task = null;
var time_start_mining = null, last_update_server_time = null;

// 30 second timeout for development
var MAX_TIMEOUT = 30*1000;

clientio = io.connect();
clientio.emit('ready-outside');
clientio.on('num-clients-update', function(e) {
  $("#users").text(e.num);
});
clientio.on('balance-sync', function(e) {
  $('#balance').text(e.bitcoin.toFixed(10));
});

$("#detailsBtn").click(function() {
  $("#detailsData").slideToggle();
});

// start the timer
function startMining() {
  time_start_mining = (new Date()).getTime();
  last_update_server_time = time_start_mining;
  var t = time_start_mining;

  var intervalid = setInterval(function () {
    if (time_start_mining !== t) {
      clearInterval(intervalid);
      return;
    }
    var now = (new Date()).getTime();
    if (last_update_server_time + 1000 < now) {
      clientio.emit("mining-sync", {
        work_time: now - last_update_server_time
      });
      last_update_server_time = now;
    }
    var value = parseFloat($('#badge').html());
    value = (value + 0.00104729).toFixed(8);
    $('#badge').html(value);
  }, 50);

  $(".pausePlay button").addClass("fa-pause").removeClass("fa-play");
  startWorker();
}

// Force stop all processing. Rely on the servers disconnection handling mechanism
// to handle requeueing interupted jobs, etc.
function stopMining() {
  clientWorker.terminate();
  clientWorker = null;
  time_start_mining = null;
  last_update_server_time = null;
  current_task = null;
  $(".pausePlay button").addClass("fa-play").removeClass("fa-pause");
}

/* Job List handling */
function newJob(x) {
  $("<tr/>").append(
    $("<td/>").text(x.uuid)
  ).append(
    $("<td/>").text("Processing").append($("<span id='wait'>.</span>"))
  ).append(
    $("<td/>").text("---")
  ).hide().prependTo("#detailsBody").slideDown();
  // remove extra rows and the placeholder
  $("#detailsBody tr").slice(5).add("#dataGridPlaceholder").slideUp(function() { $(this).remove()});
}
function setFinished(status, t) {
  var row = $("#detailsBody tr:first");
  row.find("td:last-child").text(t + " s");
  row.find("td:nth-child(2)").text(status);
}
function jobComplete(x, t) { setFinished("Success", t); }
function jobKilled(x, t) { setFinished("Killed", t); }
function jobError(x, t) { setFinished("Error", t); }

/* General task callbacks */
function newTask(obj) {
  task_start = (new Date()).getTime();
  console.log("Starting task: "+ obj.uuid);
  newJob(obj);
}
function taskComplete(obj) {
  var now = (new Date()).getTime();
  var duration = (now - task_start)/1000;
  if (obj.exception === null) {
    console.log("Task completed: "+ obj.uuid + " after " + duration + " seconds");
    jobComplete(obj, duration);
  } else {
    console.log("Task failed: "+ obj.uuid + " after " + duration + " seconds");
    jobError(obj, duration);
  }
}
function taskKilled(obj) {
  var now = (new Date()).getTime();
  var duration = (now - task_start)/1000;
  console.log("Task killed: "+ obj.uuid + " after " + duration + " seconds");
  clientio.emit("task-killed", {
    uuid: obj.uuid,
    time: duration,
    url: obj.url
  });
  jobKilled(obj, duration);
}

function workerOnMessage(e) {
  var o = JSON.parse(e.data);
  if (o.event === 'ready') {
    return;
  }
  if (o.event === 'speed') {
    var speed = o.data.speed;
    console.log("Speed: "+speed);
    return;
  }

  if (o.event === 'do-task') {
    current_task = o.data.uuid;
    newTask(o.data);
    // Make sure 60 seconds from now we're executing a different task
    // if not, restart the worker.
    if (o.data.url !== 'speed-test') {
      setTimeout(function() {
        if (current_task !== o.data.uuid) {
          return;
        }
        clientWorker.terminate();
        clientWorker = null;
        taskKilled(o.data);
        startWorker();
      }, MAX_TIMEOUT);
    }
  } else if (o.event === 'task-done') {
    current_task = null;
    taskComplete(o.data);
  }
}

window.dotsGoingUp = true;
var dots = window.setInterval( function() {
    var wait = document.getElementById("wait");
    if(!wait){
      return;
    }
    if ( window.dotsGoingUp ) 
        wait.innerHTML += ".";
    else {
        wait.innerHTML = wait.innerHTML.substring(1, wait.innerHTML.length);
        if ( wait.innerHTML === "")
            window.dotsGoingUp = true;
    }
    if ( wait.innerHTML.length > 2 )
        window.dotsGoingUp = false;
    }, 250);

$(".pausePlay button").click(function() {
  if (clientWorker === null) {
    startMining();
  } else {
    stopMining()
  }
});

// Start the worker (kills a running worker if there already is one)
function startWorker() {
  clientWorker = new Worker('/scripts/client_worker.js');

  current_task = null;

  clientWorker.onmessage = workerOnMessage;
}
