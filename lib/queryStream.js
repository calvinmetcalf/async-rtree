'use strict';
var utils = require('./utils');
var noms = require('noms').obj;

module.exports = queryStream;

function queryStream(store, bbox) {
  var queue = ['root'];
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
            self.push(child);
          } else {
            queue.push(child.id);
          }
        }
      }
      done();
    }, done);
  });
}