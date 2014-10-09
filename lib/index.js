'use strict';
var Promise = require('bluebird');
var utils = require('./utils');
var MemStore = require('./memmap');
var uuid = require('node-uuid');
var insert = require('./insert');
var remove = require('./remove');
var bulk = require('./bulk');
var query = require('./query');
var extend = require('xtend');
var queryStream = require('./queryStream');
var Batches = require('./batches');

module.exports = RTree;
function promisify(store) {
  var out = {};
  ['get', 'put', 'del', 'batch'].forEach(function (key) {
    out[key] = Promise.promisify(store[key], store);
  });
  return out;
}
function RTree(store, opts) {
  opts = extend({
    MIN: 3,
    MAX: 9
  }, opts);
  this.MAX = opts.MAX;
  this.MIN = opts.MIN;
  this.store = promisify(store || new MemStore());
  this.root = false;
  this.queue = [];
  this.inProgress = false;
}
RTree.prototype.insert = function (id, bbox, cb) {
  return this.taskQueue(insert, this, id, bbox, false, false).nodeify(cb);
};
RTree.prototype.remove = function (id, bbox, cb) {
  if (!Array.isArray(bbox)) {
    cb = bbox;
    bbox = void 0;
  }
  return this.taskQueue(remove, this, id, bbox, false).nodeify(cb);
};
RTree.prototype.bulk = function (array, cb) {
  return this.taskQueue(bulk, this, array).nodeify(cb);
};
RTree.prototype.query = function (bbox, cb) {
  if (cb) {
    return query(this, bbox).nodeify(cb);
  }
  return queryStream(this.store, bbox);
};
RTree.prototype.taskQueue = function (func) {
  var args = new Array(arguments.length -1);
  var len = arguments.length;
  var i = 0;
  while (++i < len) {
    args[i - 1] = arguments[i];
  }
  var self = this;
  function after(resp) {
    if (self.queue.length) {
      self.flushQueue();
    } else {
      self.inProgress = false;
    }
  }
  if (!this.inProgress) {
    this.inProgress = true;
    var res = func.apply(undefined, args);
    res.then(after);
    return res;
  } else {
    return new Promise (function (fulfill, reject) {
      self.queue.push({
        error: reject,
        fulfill: fulfill,
        args: args,
        func: func
      });
    });
  }
};
RTree.prototype.flushQueue = function () {
  var self = this;
  if (!this.queue.length) {
    self.inProgress = false;
    return;
  }
  if (this.queue.length === 1) {
    var item = this.queue.pop();
    var res = item.func.apply(undefined, item.args);
    item.fulfill(res);
    res.then(function () {
      if (self.queue.length) {
        self.flushQueue();
      } else {
        self.inProgress = false;
      }
    });
    return;
  }
  var store = new Batches(self.store);
  var promise = Promise.resolve(true);
  var fullfill;
  var done = new Promise(function (f) {
    fullfill = f;
  });
  var i = 0;
  this.queue.forEach(function (item){
    item.args.push(store);
    promise = promise.then(function () {
      return item.func.apply(undefined, item.args);
    });
    item.fulfill(done);
  });
  this.queue = [];
  promise.then(function () {
    return store.save();
  }).then(function (resp) {
    fullfill(resp);
    self.flushQueue();
  });
};

