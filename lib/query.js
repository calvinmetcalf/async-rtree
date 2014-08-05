'use strict';
var Promise = require('bluebird');
var queryStream = require('./queryStream');
module.exports = query;
function query(self, bbox) {
  return new Promise(function (fullfill, reject) {
    var out = [];
    queryStream(self.store, bbox).on('data', function (d){
      out.push(d);
    }).on('error', function (e) {
      reject(e);
    }).on('end', function () {
      fullfill(out);
    });
  });
}