'use strict';
var remove = require('./remove');
module.exports = checkNew;
function checkNew(self, id, bbox, store) {
  var newID = '$' + id;
  return store.get(newID).then(function () {
    return remove(self, id, bbox, false);
  }, function () {
    //not there, no need to do anything
  }).then(function () {
    return store.put(newID, bbox);
  });
}