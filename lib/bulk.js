'use strict';
var load = require('./load');
var insert = require('./insert');
var uuid = require('node-uuid');
var utils = require('./utils');
module.exports = bulk;
function bulk (self, array) {
  var inRoot = array[0];
  var processed = load(array);
  if (!self.root) {
    inRoot.id = 'root';
    return self.store.batch(array).then(function (resp) {
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
      return self.store.batch(array);
    } else if(root.level < inRoot) {
      inRoot.id = 'root';
      root.id = uuid.v4();
      array.push(root);
      return self.store.batch(array).then(function () {
        insert(self, root.id, root.bbox, 'root', inRoot.level - root.level);
      });
    } else {
      return self.store.batch(array).then(function () {
        insert(self, inRoot.id, inRoot.bbox, 'root', root.level - inRoot.level);
      });
    }
  });
}