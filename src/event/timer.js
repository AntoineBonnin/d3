import "../core/document";
import "../core/vendor";

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_active, // active timer object
    d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) { setTimeout(callback, 17); };

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();

  // Add the callback to the tail of the queue.
  var time = then + delay, timer = {callback: callback, time: time, next: null};
  if (d3_timer_queueTail) d3_timer_queueTail.next = timer;
  else d3_timer_queueHead = timer;
  d3_timer_queueTail = timer;

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
};

function d3_timer_step() {
  var now = d3_timer_mark(),
      delay = d3_timer_sweep() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  d3_timer_mark();
  d3_timer_sweep();
};

function d3_timer_replace(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();
  d3_timer_active.callback = callback;
  d3_timer_active.time = then + delay;
}

function d3_timer_mark() {
  var now = Date.now();
  d3_timer_active = d3_timer_queueHead;
  while (d3_timer_active) {
    if (now >= d3_timer_active.time) d3_timer_active.flush = d3_timer_active.callback(now - d3_timer_active.time);
    d3_timer_active = d3_timer_active.next;
  }
  return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
  var t0,
      t1 = d3_timer_queueHead,
      time = Infinity;
  while (t1) {
    if (t1.flush) {
      t1 = t0 ? t0.next = t1.next : d3_timer_queueHead = t1.next;
    } else {
      if (t1.time < time) time = t1.time;
      t1 = (t0 = t1).next;
    }
  }
  d3_timer_queueTail = t0;
  return time;
}
