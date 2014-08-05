'use strict';
var Readable = require('readable-stream').Readable;
var inherits = require('inherits');
var Promise = require('bluebird');
var utils = require('./utils');

module.exports = QueryStream;
inherits(QueryStream, Readable);
function QueryStream(store, bbox) {
  if (!(this instanceof QueryStream)) {
    return new QueryStream(store, bbox);
  }
  Readable.call(this, {
    objectMode: true
  });
  this.store = store;
  this.bbox = bbox;
  this.queue = ['root'];
  this.inProgress = false;
}
QueryStream.prototype._read = function () {
  if (this.inProgress) {
    return;
  }

  var store = this.store;
  var bbox = this.bbox;
  var queue = this.queue;
  var self = this;
  if (!queue.length) {
    self.push(null);
    return;
  }
  this.inProgress = true;
  var called = false;
  var more = true;
  function onErr(e) {
    self.emit(e);
  }
  function getNode(node) {
    var i = -1;
    var len = node.children.length;
    var child;
    while (++i < len) {
      child = node.children[i];
      if (utils.intersects(child.bbox, bbox)) {
        if (child.leaf) {
          called = true;
          more = self.push(child);
        } else {
            queue.push(child.id);
        }
      }
    }
    if (called && !more) {
      self.inProgress = false;
      return;
    }
    if (queue.length) {
      store.get(queue.pop()).then(getNode, onErr);
    } else {
      self.push(null);
      self.inProgress = false;
    }
  }
  store.get(queue.pop()).then(getNode, onErr);
};