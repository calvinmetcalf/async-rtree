'use strict';
var _insert = require('./_insert');
var checkNew = require('./checkNew');
module.exports = insert;
function insert(self, id, bbox, nodeID, height, store) {
   store = store || self.store;
   return checkNew(self, id, bbox, store).then(function () {
    return _insert(self, id, bbox, nodeID, height, store);
  });
}