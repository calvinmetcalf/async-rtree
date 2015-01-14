'use strict';
var Promise = require('bluebird');
var remove = require('./remove');
module.exports = checkNew;
function checkNew(self, id, bbox, store) {
  var newID = '$' + id;
  return store.get(newID).then(function (bboxen) {
    return Promise.all(bboxen.map(function (bbox) {
      return remove(self, id, bbox, false, store);
    }));
  }, function () {
    //not there, no need to do anything
  }).then(function () {
    return store.put(newID, [bbox]);
  });
}