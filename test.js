'use strict';
var LT = require('./lib/index');
var Promise = require('bluebird');
var test = require('tape');
var fs = require('fs');
function promiseQuery(db, bbox) {
  return new Promise(function (yes, no) {
    var out = [];
    db.query(bbox).on('data', function (d) {
      out.push(d);
    }).on('error', no).on('end', function () {
      yes(out);
    });
  });
}
test('large query', function (t) {
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
    t.end();
  }).catch(function (e) {
    t.notOk(e);
    t.end();
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
  }).then(function(a) {
    t.equals(a.length, 2);
  }).catch(function (e) {
    t.notOk(e);
  });

});
test('small query stream', function (t) {
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
    return promiseQuery(l,[ [ 31, 30 ], [ 50, 60 ] ]);
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
test('remove no bbox', function (t) {
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
    return l.remove('fafa');
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
test('bulk loaded large query', function (t) {
  t.plan(2);
  var l = new LT();
  var i = 100;
  var toLoad = [
    {
      id: 'lala',
      bbox: [[31,30],[40,40]]
    },
    {
      id: 'fafa',
      bbox: [[32,40],[50,60]]
    }
  ];

  while (i--) {
      toLoad.push({id:'afa'+i,bbox:[[20-i,20-i],[40-i,20+i]]});
  }
  l.bulk(toLoad).then(function () {
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function(a){
    t.equals(a.length, 102);
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function (a) {
    t.equals(a.length, 2);
  }).catch(function (e) {
    t.notOk(e);
  });

});
test('bulk loaded large query data already in', function (t) {
  t.plan(2);
  var l = new LT();
  var i = 100;
  var toLoad = [
  ];
  var promise = l.insert('lala', [[31,30],[40,40]]).then(function (a){
    return l.insert('fafa',[[32,40],[50,60]]);
  });
  while (i--) {
      toLoad.push({id:'afa'+i,bbox:[[20-i,20-i],[40-i,20+i]]});
  }
  promise.then(function () {
    return l.bulk(toLoad);
  }).then(function () {
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function(a){
    t.equals(a.length, 102);
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function (a) {
    t.equals(a.length, 2);
  }).catch(function (e) {
    t.notOk(e);
  });

});
test('bulk loaded then put some in', function (t) {
  t.plan(2);
  var l = new LT();
  var i = 100;
  var toLoad = [
  ];
  while (i--) {
      toLoad.push({id:'afa'+i,bbox:[[20-i,20-i],[40-i,20+i]]});
  }
  l.bulk(toLoad).then(function () {
    return l.insert('lala', [[31,30],[40,40]]).then(function (a){
      return l.insert('fafa',[[32,40],[50,60]]);
    });
  }).then(function () {
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function(a){
    t.equals(a.length, 102);
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function (a) {
    t.equals(a.length, 2);
  }).catch(function (e) {
    t.notOk(e);
  });

});

test('bulk loaded then smaller bulk load', function (t) {
  t.plan(2);
  var l = new LT();
  var i = 100;
  var toLoad = [
  ];
  while (i--) {
      toLoad.push({id:'afa'+i,bbox:[[20-i,20-i],[40-i,20+i]]});
  }
  l.bulk(toLoad).then(function () {
    return l.bulk([
      {
        id: 'lala',
        bbox: [[31,30],[40,40]]
      },
      {
        id: 'fafa',
        bbox: [[32,40],[50,60]]
      }
    ]);
  }).then(function () {
    return l.query([ [ -10000, -10000 ], [ 10000, 10000 ] ], true);
  }).then(function(a){
    t.equals(a.length, 102);
    return l.query([ [ 31, 30 ], [ 50, 60 ] ], true);
  }).then(function (a) {
    t.equals(a.length, 2);
  }).catch(function (e) {
    t.notOk(e);
  });

});