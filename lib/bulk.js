'use strict';
var load = require('./load');
var insert = require('./insert');
var uuid = require('uuid');
var utils = require('./utils');
var Promise = require('bluebird');
var checkNew = require('./checkNew');
function toBatch(item) {
  return {
    value: item,
    key: item.id
  };
}
module.exports = bulk;
function bulk (self, inArray, store) {
  store = store || self.store;
  return Promise.all(inArray.map(function (item) {
    return checkNew(self, item.id, item.bbox, store);
  })).then(function () {
    var array = load(self, inArray);
    var inRoot = array[0];
    if (!self.root) {
      inRoot.id = 'root';
      return store.batch(array.map(toBatch)).then(function (resp) {
        self.root = 'root';
        return resp;
      });
    }
    return store.get(self.root).then(function (root) {
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
        return store.batch(array.map(toBatch));
      } else if(root.level < inRoot) {
        inRoot.id = 'root';
        root.id = uuid.v4();
        array.push(root);
        return store.batch(array.map(toBatch)).then(function () {
          return insert(self, root.id, root.bbox, 'root', inRoot.level - root.level, store);
        });
      } else {
        return store.batch(array.map(toBatch)).then(function () {
          return insert(self, inRoot.id, inRoot.bbox, 'root', root.level - inRoot.level, store);
        });
      }
    });
  });
}