'use strict';
var utils = require('./utils');
module.exports = load;
var MAX = 9;
var MIN = 3;
function load(array, level, height) {
  level = level || 0;
  var len = array.length;
  var node;
  //var MAX = MAX;
  if (len <= MAX) {
    node = {
      children: array,
      level: 1
    };
    node.bbox = node.children.length > 1? node.children.reduce(utils.enlarger): node.children[0].bbox;
    return node;
  }

  if (!level) {
    // target height of the bulk-loaded tree
    height = Math.ceil(Math.log(len) / Math.log(MAX));

    // target number of root entries to maximize storage utilization
    //MAX = Math.ceil(len / Math.pow(MAX, height - 1));

    utils.chooseAxis(array, MIN);
  }

  // TODO eliminate recursion?

  node = {
      children: []
  };

  var len1 = Math.ceil(len / MAX) * Math.ceil(Math.sqrt(MAX));
  var len2 = utils.max(Math.ceil(len / MAX), MIN);
  var i = 0 - len1;
  var j, slice, sliceLen, childNode;
  console.log(len1, len2);
  // split the items into M mostly square tiles.exit
  while ((i += len1) < len) {
    slice = array.slice(i, i + len1);
    utils.chooseAxis(slice, MIN);
    j = 0 - len2;
    sliceLen = slice.length;
    while ((j += len2) < sliceLen) {
      // pack each entry recursively
      childNode = load(slice.slice(j, j + len2), level + 1, height - 1);
      node.children.push(childNode);
    }
  }
  node.bbox = node.children.length > 1? node.children.reduce(utils.enlarger): node.children[0].bbox;
  node.level = (Math.max.apply(Math, node.children.map(function (child) {
    return child.level;
  })) + 1);
  return node;
}