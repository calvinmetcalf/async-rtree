'use strict';
var gbv = require('geojson-bounding-volume');
var Promise = require('bluebird');
var utils = require('./utils');
var MemStore = require('./memmap');
var uuid = require('node-uuid');
var insert = require('./insert');
var remove = require('./remove');
var query = require('./query');
var MIN = 3;
var MAX = 9;

module.exports = RTree;
function RTree(store) {
  this.store = store || new MemStore();
  this.root = false;
  this.queue = [];
  this.inProgress = false;
}
RTree.prototype.insert = function (id, bbox) {
  return this.taskQueue(insert, this, id, bbox);
};
RTree.prototype.query = function (bbox) {
  return query(this, bbox);
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
      self.queue.shift().run();
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
        run: function () {
          var res = func.apply(undefined, args);
          fulfill(res);
          res.then(after);
        },
        error: reject
      });
    });
  }
};
RTree.prototype.remove = function (id, bbox) {
  return this.taskQueue(remove, this, id, bbox);
};

