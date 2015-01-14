'use strict';
var Promise = require('bluebird');
var utils = require('./utils');
module.exports = _remove;
var Batches = require('./batches');
function _remove(self, id, bbox, nodeID, store) {
  if (store) {
    return remove(self, id, bbox, nodeID, store);
  }
  store = new Batches(self.store);
  return remove(self, id, bbox, nodeID, store).then(function (resp) {
    return store.save().then(function () {
      return resp;
    });
  });
}
function remove(self, id, bbox, nodeID, store) {
  if (!nodeID) {
    if (!self.root) {
      return Promise.reject(new Error('can\'t delete it if there is nothing in the tree'));
    } else {
      if (!bbox) {
        return store.get('$' + id).then(function (bboxen) {
          var out = Promise.resolve();
          bboxen.forEach(function (bbox, i) {
            out = out.then(function (){
             return remove(self, id, bbox, self.root, store).then(function (resp) {
              return resp;
             });
           });
          });
          return out;
        }, function (e) {
          throw new Error ('not found');
        });
      } else {
        return remove(self, id, bbox, self.root, store);
      }
    }
  }
  return store.get(nodeID).then(function (root) {
    return findPath(store, id, bbox, [[root]]);
  }).then(function (path) {
    var node = path.pop();
    var things = [];
    var i = path.length - 1;
    var tail = path[i];
    tail.children.splice(indexByBbox(bbox, tail.children), 1);
    things.push(store.put(tail.id, tail));
    var nbbox, index;
    while (i) {
      i--;
      node = tail;
      tail = path[i];
      if (!node.children.length) {
        tail.children.splice(indexById(node.id, tail.children), 1);
        things.push(store.del(node.id));
        things.push(store.put(tail.id, tail));
        continue;
      }
      nbbox = node.bbox;
      node.bbox = node.children.reduce(utils.enlarger);
      if (utils.equals(nbbox, node.bbox)) {
        break;
      }
      index = indexById(node.id, tail.children);
      tail.children[index].bbox = [node.bbox[0].slice(), node.bbox[1].slice()];
        things.push(store.put(tail.id, tail));
    }
    return Promise.all(things);
  });
}

function indexByBbox(bbox, children) {
  var i = -1;
    var len = children.length;
    while (++i < len) {
      if (utils.equals(bbox, children[i].bbox)) {
        return i;
      }
    }
    throw new Error('id not in node it is claimed to be in');
}
function indexById(id, children) {
  var i = -1;
    var len = children.length;
    while (++i < len) {
      if (id === children[i].id) {
        return i;
      }
    }
    throw new Error('id not in node it is claimed to be in');
}
function findPath(store, id, bbox, queue) {
  if (!queue.length) {
    throw new Error('not found');
  }
  var path = queue.pop();
  var node = path[path.length - 1];
  var candidates = [];
  var i = -1;
  var len = node.children.length;
  var child;
  while (++i < len) {
    child = node.children[i];
    if (child.id === id && utils.equals(child.bbox, bbox)) {
      path.push(child);
      return path;
    } else if (!child.leaf){
      if (utils.contains(child.bbox, bbox)) {
        candidates.push(child.id);
      }
    }
  }
  return Promise.all(candidates.map(function (id) {
    return store.get(id);
  })).then(function (items) {
    items.forEach(function (item) {
      var nPath = path.slice();
      nPath.push(item);
      queue.push(nPath);
    });
    return findPath(store, id, bbox, queue);
  });
}