'use strict';
var uuid = require('uuid');
exports.contains = contains;
function contains(a, b) {
  var i = -1;
  var len = a[0].length;
  while (++i < len) {
    if (a[0][i] > b[0][i] || a[1][i] < b[1][i]) {
      return false;
    }
  }
  return true;
}
exports.intersects = intersects;
function intersects(a, b) {
  var i = -1;
  var len = b[0].length;
  while (++i < len) {
    if (b[0][i] > a[1][i] || a[0][i] > b[1][i]) {
      return false;
    }
  }
  return true;
}

exports.min = min;
function min(a, b) {
  if (a < b) {
    return a;
  } else {
    return b;
  }
}
exports.max = max;
function max(a, b) {
  if (a > b) {
    return a;
  } else {
    return b;
  }
}
exports.enlarge = enlarge;
function enlarge(a, b) {
  var len = min(a[0].length, b[0].length);
  var out = [
    new Array(len),
    new Array(len)
  ];
  var i = -1;
  while (++i < len) {
    out[0][i] = min(a[0][i], b[0][i]);
    out[1][i] = max(a[1][i], b[1][i]);
  }
  return out;
}
exports.intersection = intersection;
function intersection(a, b) {
  var len = min(a[0].length, b[0].length);
  var out = [
    new Array(len),
    new Array(len)
  ];
  var i = -1;
  while (++i < len) {
    out[0][i] = max(a[0][i], b[0][i]);
    out[1][i] = min(a[1][i], b[1][i]);
  }
  return out;
}
exports.area = area;
function area(box) {
  var len = box[0].length;
  var out = 1;
  var i = -1;
  while (++i < len) {
    out *= (box[1][i] - box[0][i]);
  }
  return out;
}
exports.margin = margin;
function margin(box) {
  var len = box[0].length;
  var out = 0;
  var i = -1;
  while (++i < len) {
    out += (box[1][i] - box[0][i]);
  }
  return out;
}

exports.enlarger = enlarger;
function enlarger (a, b) {
  if (a.bbox) {
    a = a.bbox;
  }
  return enlarge(a, b.bbox);
}
exports.equals = equals;
function equals (a, b) {
  var len = a[0].length;
  var i = -1;
  while (++i < len) {
    if(a[0][i] !== b[0][i] || a[1][i] !== b[1][i]) {
      return false;
    }
  }
  return true;
}
exports.chooseAxis = chooseAxis;
function chooseAxis(children, MIN) {
  var indices = children[0].bbox[0].length;
  var i = 0;
  var minMargin = allDistMargin(children, 0, MIN);
  var mindex = 0;
  var margin;
  while (++i < indices) {
    margin = allDistMargin(children, i, MIN);
    if (margin < minMargin) {
      mindex = i;
      minMargin = margin;
    }
  }
  if (mindex !== (i - 1)) {
    children.sort(function (a, b) {
      return a.bbox[0][mindex] - b.bbox[0][mindex];
    });
  }
}
exports.allDistMargin = allDistMargin;
function allDistMargin(children, index, MIN) {
  var len = children.length;

  children.sort(function (a, b) {
    return a.bbox[0][index] - b.bbox[0][index];
  });

  var leftBBox = children.slice(0, MIN).reduce(enlarger);
  var rightBBox = children.slice(len - MIN, len).reduce(enlarger);
  var calcedMargin = margin(leftBBox) + margin(rightBBox);
  var i = MIN - 1;
  var child;
  while (++i < len - MIN) {
    child = children[i];
    leftBBox = enlarge(leftBBox, child.bbox);
    calcedMargin += margin(leftBBox);
  }
  i = len - MIN;
  while (--i >= MIN) {
    child = children[i];
    rightBBox = enlarge(rightBBox, child.bbox);
    calcedMargin += margin(rightBBox);
  }

  return calcedMargin;
}
exports.chooseIndex = chooseIndex;
function chooseIndex(children, MIN) {
  var len = children.length;

  var i = MIN;
  var leftBBox = children.slice(0, i).reduce(enlarger);
  var rightBBox = children.slice(len - i, len).reduce(enlarger);
  var area, overlap;
  var minOverlap = exports.area(intersection(leftBBox, rightBBox));
  var minArea = exports.area(leftBBox) + exports.area(rightBBox);
  var mindex = i;
  while (++i < len) {
    leftBBox = children.slice(0, i).reduce(enlarger);
    rightBBox = children.slice(len - i, len).reduce(enlarger);
    overlap = exports.area(intersection(leftBBox, rightBBox));
    area = exports.area(leftBBox) + exports.area(rightBBox);
    if (overlap < minOverlap || (overlap === minOverlap && area < minArea)) {
      minOverlap = overlap;
      mindex = i;

      minArea = area < minArea ? area : minArea;
    }
  }
  return mindex;
}
exports.splitNode = splitNode;
function splitNode(node, MIN) {
  chooseAxis(node.children, MIN);
  var index = chooseIndex(node.children, MIN);
  var newNode = {
    id: uuid.v4(),
    level: node.level
  };
  newNode.children = node.children.slice(0, index);
  node.children = node.children.slice(index, node.children.length);
  newNode.bbox = newNode.children.reduce(enlarger);
  node.bbox = node.children.reduce(enlarger);
  return newNode;
}