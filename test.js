'use strict';
var LT = require('./lib/index');
var Promise = require('bluebird');
var test = require('tape');

test('large query', function (t) {
  t.plan(1);
  var l = new LT();
  var i = 100;
  var promise = l.insert('lala', [[31,30],[40,40]]).then(function (a){
    return l.insert('fafa',[[32,40],[50,60]]);
  });
  var out = [];
  while (i--) {
      out.push(l.insert('afa'+i,[[20-i,20-i],[40-i,20+i]]));
  }
  promise.then(function () {
    return Promise.all(out);
  }).then(function (a) {
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function(a){
    t.equals(a.length, 102);
  }).catch(function (e) {
    t.notOk(e);
  });

});
test('small query', function (t) {
  t.plan(1);
  var l = new LT();
  var i = 100;
  var promise = l.insert('lala', [[31,30],[40,40]]).then(function (a){
    return l.insert('fafa',[[32,40],[50,60]]);
  });
  var out = [];
  while (i--) {
      out.push(l.insert('afa'+i,[[20-i,20-i],[40-i,20+i]]));
  }
  promise.then(function () {
    return Promise.all(out);
  }).then(function (a) {
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function(a){
    t.equals(a.length, 2);
  }).catch(function (e) {
    t.notOk(e);
  });

});
test('remove', function (t) {
  t.plan(4);
  var l = new LT();
  var i = 100;
  var promise = l.insert('lala', [[31,30],[40,40]]).then(function (a){
    return l.insert('fafa',[[32,40],[50,60]]);
  });
  var out = [];
  while (i--) {
      out.push(l.insert('afa'+i,[[20-i,20-i],[40-i,20+i]]));
  }
  promise.then(function () {
    return Promise.all(out);
  }).then(function (a) {
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function(a){
    t.equals(a.length, 2);
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function (a){
    t.equals(a.length, 102);
    return l.remove('fafa',[[32,40],[50,60]]);
  }).then(function (a) {
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function(a){
    t.equals(a.length, 1);
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function (a){
    t.equals(a.length, 101);
  }).catch(function (e) {
    t.notOk(e, e.stack);
  });

});
