'use strict';
var utils = require('./utils');
var noms = require('noms').obj;

module.exports = queryStream;

function queryStream(self, bbox) {
  var store = self.store;
  var queue = [];
  if (self.root) {
    queue.push(self.root);
  }
  return noms(function (done) {
    var self = this;
    if (!queue.length) {
      return self.push(null);
    }
    
    store.get(queue.pop()).then(function getNode(node) {
      var i = -1;
      var len = node.children.length;
      var child;
      while (++i < len) {
        child = node.children[i];
        if (utils.intersects(child.bbox, bbox)) {
          if (child.leaf) {
            self.push({
              id: child.id,
              bbox: child.bbox
            });
          } else {
            queue.push(child.id);
          }
        }
      }
      done();
    }, done);
  });
}