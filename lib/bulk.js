'use strict';
var load = require('./load');
var insert = require('./insert');
var uuid = require('node-uuid');
var utils = require('./utils');
function toBatch(item) {
  return {
    value: item,
    key: item.id
  };
}
module.exports = bulk;
function bulk (self, inArray) {
  var array = load(self, inArray);
  var inRoot = array[0];
  if (!self.root) {
    inRoot.id = 'root';
    return self.store.batch(array.map(toBatch)).then(function (resp) {
      self.root = 'root';
      return resp;
    });
  }
  return self.store.get(self.root).then(function (root) {
    if (root.level === inRoot.level) {
      root.id = uuid.v4();
      array.push(root);
      array.push({
        id: 'root',
        children: [
          {
            id: root.id,
            bbox: [root.bbox[0].slice(), root.bbox[1].slice()]
          },
          {
            id: inRoot.id,
            bbox: [inRoot.bbox[0].slice(), inRoot.bbox[1].slice()]
          }
        ],
        level: root.level + 1,
        bbox: utils.enlarge(root.bbox, inRoot.bbox)
      });
      return self.store.batch(array.map(toBatch));
    } else if(root.level < inRoot) {
      inRoot.id = 'root';
      root.id = uuid.v4();
      array.push(root);
      return self.store.batch(array.map(toBatch)).then(function () {
        return insert(self, root.id, root.bbox, 'root', inRoot.level - root.level);
      });
    } else {
      return self.store.batch(array.map(toBatch)).then(function () {
        return insert(self, inRoot.id, inRoot.bbox, 'root', root.level - inRoot.level);
      });
    }
  });
}