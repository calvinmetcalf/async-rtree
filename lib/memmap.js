'use strict';
var Promise = require('bluebird');

var TRUE = Promise.resolve(true);
var FALSE = Promise.resolve(false);
function parseJSON (string) {
  // so as not to have to deal with the errors
  return new Promise(function (fullfill) {
    fullfill(JSON.parse(string));
  });
}
module.exports = MemStore;

function MemStore() {
  this.store = Object.create(null);
}
MemStore.prototype.get = function(key, cb) {
  key = '$' + key;
  if (key in this.store) {
    return parseJSON(this.store[key]).nodeify(cb);
  } else {
    var err = new Error('not found');
    err.notFound = true;
    return Promise.reject(err).nodeify(cb);
  }
};
MemStore.prototype.put = function(key, value, cb) {
  key = '$' + key;
  this.store[key] = JSON.stringify(value);
  return TRUE.nodeify(cb);
};

MemStore.prototype.del = function(key, cb) {
  key = '$' + key;
  if (key in this.store) {
    delete this.store[key];
    return TRUE.nodeify(cb);
  }
  return FALSE.nodeify(cb);
};
MemStore.prototype.batch = function(array, cb) {
  var self = this;
  return Promise.all(array.map(function (item) {
    if (item.type === 'del') {
      return self.del(item.key);
    }
    return self.put(item.key, item.value);
  })).nodeify(cb);
};
MemStore.prototype.clear = function(cb) {
  this.store = Object.create(null);
  return TRUE.nodeify(cb);
};