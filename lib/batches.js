'use strict';
var StringMap = require('stringmap');
var StringSet = require('stringset');
var Promise = require('bluebird');
var TRUE = Promise.resolve(true);
module.exports = Batch;
function noop(){}
function Batch(store) {
  this.store = store;
  this.cache = new StringMap();
  this.deletes = new StringSet();
}

Batch.prototype.get = function(key, cb) {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (self.cache.has(key)) {
      resolve(self.cache.get(key));
    } else if (self.deletes.has(key)) {
      var err = new Error('not found');
      err.notFound = true;
      reject(err);
    } else {
      resolve(self.store.get(key));
    }
  }).nodeify(cb);
};
Batch.prototype.put = function(key, value, cb) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.cache.set(key, value);
    if (self.deletes.has(key)) {
      self.deletes.delete(key);
    }
    resolve(TRUE);
  }).nodeify(cb);
};
Batch.prototype.del = function(key, cb) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.deletes.add(key);
    if (self.cache.has(key)) {
      self.cache.delete(key);
    }
    resolve(TRUE);
  }).nodeify(cb);
};
Batch.prototype.batch = function(array, cb) {
  return Promise.all(array.map(function (item){
     if (item.type === 'del') {
      return this.del(item.key);
    }
    return this.put(item.key, item.value);
  }, this)).nodeify(cb);
};
Batch.prototype.save = function () {
  var items = this.deletes.items().map(function (key) {
    return {
      type: 'del',
      key: key
    };
  });
  items = items.concat(this.cache.map(function (value, key) {
    return {
      key: key,
      value: value
    };
  }));
  this.cache = new StringMap();
  this.deletes = new StringSet();
  return this.store.batch(items);
};