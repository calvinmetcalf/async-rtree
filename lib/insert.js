'use strict';
var utils = require('./utils');
var uuid = require('node-uuid');

module.exports = insert;

function insert(self, id, bbox, nodeID, height) {
  var store = self.store;
  if (!nodeID) {
    if (!self.root) {
      return store.put('root', {
        bbox: bbox,
        id: 'root',
        level: 1,
        children: [{
          id: id,
          bbox: bbox,
          leaf:true
        }]
      }).then(function (resp){
        self.root = 'root';
        return resp;
      });
    } else {
      return insert(self, id, bbox, self.root);
    }
  }
  return choosePath(self, bbox, nodeID, [], height).then(function (path) {
    var leaf = path[path.length - 1];
    if (height) {
      leaf.children.push({
        id: id,
        bbox: bbox
      });
    } else {
      leaf.children.push({
        id: id,
        bbox: bbox,
        leaf: true
      });
    }
    leaf.bbox = utils.enlarge(bbox, leaf.bbox);
    if (leaf.children.length >= self.MAX) {
      splitLeaf(self, path);
    }
    return updatePath(self.store, path);
  });
}

// much of this from rbush
function splitLeaf(self, path) {
  var i = path.length;
  var newNode, splitedNode;
  while (--i && path[i].children.length >= self.MAX) {
    newNode = utils.splitNode(path[i], self.MIN);
    path[i - 1].children.push({
      id: newNode.id,
      bbox: newNode.bbox
    });
    path.push(newNode);
  }
  if (i === 0 && path[0].children.length >= self.MAX) {
    newNode = {
      id: uuid.v4(),
      bbox: [path[0].bbox[0].slice(), path[0].bbox[1].slice()],
      children: path[0].children,
      level: path[0].level
    };
    path.push(newNode);
    splitedNode = utils.splitNode(newNode, self.MIN);
    path.push(splitedNode);
    path[0].level++;
    path[0].children = [{
      id: newNode.id,
      bbox: newNode.bbox
    }, {
      id: splitedNode.id,
      bbox: splitedNode.bbox
    }];
  }
}


function updatePath (store, path) {
  return store.batch(path.map(function (item) {
    return {
      type: 'put',
      key: item.id,
      value: item
    };
  }));
}
function choosePath(self, bbox, rootID, path, height) {
  path = path || [];
  return self.store.get(rootID).then(function (node) {
    path.push(node);
    if (node.children[0].leaf || node.height < height) {
      return path;
    }
    var bestFit = findBestFit(bbox, node.children);
    node.children[bestFit.index].bbox = bestFit.bbox;
    node.bbox = utils.enlarge(bbox, node.bbox);
    return choosePath(self, bbox, bestFit.id, path);
  });
}

function findBestFit(bbox, children) {
  var i = 0;
  var bestFitNode = children[0];
  var lastEnlargment = utils.enlarge(bbox, children[0].bbox);
  var bestArea = utils.area(lastEnlargment);
  var index = 0;
  var len = children.length;
  var area, enlarged;
  while (++i < len) {
    enlarged = utils.enlarge(bbox, children[i].bbox);
    area = utils.area(enlarged);
    if (area < bestArea) {
      index = i;
      bestFitNode = children[i];
      bestArea = area;
    }
  }
  return {
    id: bestFitNode.id,
    bbox: lastEnlargment,
    index: index
  };
}