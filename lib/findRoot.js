'use strict';

module.exports = findRoot;
function findRoot(self) {
  return self.store.get('root').then(function () {
    self.root = 'root';
  }).catch(function () {});
}
