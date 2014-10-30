'use strict';
var _insert = require('./_insert');
var checkNew = require('./checkNew');
module.exports = insert;
function insert(self, id, bbox, nodeID, height, store) {
  store = store || self.store;
   return addRecord(self, id, bbox, store).then(function () {
    return _insert(self, id, bbox, nodeID, height, store);
  });
}

function addRecord(self, id, bbox, store) {
  var newID = '$' + id;
  return store.get(newID).catch(function () {
    return [];
  }).then(function (bboxen) {
    bboxen.push(bbox);
    return store.put(newID, bboxen);
  });
}