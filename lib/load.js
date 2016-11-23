'use strict';
var utils = require('./utils');
var Promise = require('bluebird');
var uuid = require('uuid');
module.exports = function (self, array) {
  var todo = [load(self, array)];
  var current;
  var done  = [];
  var i, j, clen, len, node;
  function strip(item) {
    var out = {
      id: item.id,
      bbox: [item.bbox[0].slice(), item.bbox[1].slice()]
    };
    if ('leaf' in item) {
      out.leaf = item.leaf;
    }
    return out;
  }
  while (todo.length) {
    current = todo;
    todo = [];
    i = -1;
    len = current.length;
    while (++i < len) {
      node = current[i];
      clen = node.children.length;
      j = -1;
      // so root will always be first
      done.push(node);
      while (++j < clen) {
        if (node.children[j].children) {
          todo.push(node.children[j]);
        } else {
          node.children[j].leaf = true;
          done.push(node.children[j]);
        }
        node.children[j] = strip(node.children[j]);
      }
    }
  }
  return done;
};
function load(self, array, level, height) {
  level = level || 0;
  var len = array.length;
  var node;
  //var self.MAX = self.MAX;
  if (len <= self.MAX) {
    node = {
      children: array,
      level: 1,
      id: uuid.v4()
    };
    node.bbox = node.children.length > 1? node.children.reduce(utils.enlarger): node.children[0].bbox;
    return node;
  }

  if (!level) {
    // target height of the bulk-loaded tree
    height = Math.ceil(Math.log(len) / Math.log(self.MAX));

    // target number of root entries to maximize storage utilization
    //self.MAX = Math.ceil(len / Math.pow(self.MAX, height - 1));

    utils.chooseAxis(array, self.MIN);
  }

  // TODO eliminate recursion?

  node = {
      children: [],
      id: uuid.v4()
  };

  var len1 = Math.ceil(len / self.MAX) * Math.ceil(Math.sqrt(self.MAX));
  var len2 = utils.max(Math.ceil(len / self.MAX), self.MIN);
  var i = 0 - len1;
  var j, slice, sliceLen, childNode;
  var out = [];
  //console.log(len1, len2, len);
  // split the items into M mostly square tiles.exit
  while ((i += len1) < len) {
    if ((i + len1 + len1) > len) {
       slice = array.slice(i);
       i += len1;
    } else {
      slice = array.slice(i, i + len1);
    }
    utils.chooseAxis(slice, self.MIN);
    j = 0 - len2;
    sliceLen = slice.length;
    while ((j += len2) < sliceLen) {
      // pack each entry recursively
      out.push(slice.slice(j, j + len2));
    }
  }
  var children = out.map(function (slice) {
    return load(self, slice, level + 1, height - 1);
  });
  node.children = children;
  node.bbox = node.children.length > 1? node.children.reduce(utils.enlarger): node.children[0].bbox;
  node.level = (Math.max.apply(Math, node.children.map(function (child) {
    return child.level;
  })) + 1);
  return node;
}