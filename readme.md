async-rtree [![Build Status](https://travis-ci.org/calvinmetcalf/async-rtree.svg)](https://travis-ci.org/calvinmetcalf/async-rtree)
===

An async RTree, suitable for use with levelup, based on [rbush](https://github.com/mourner/rbush).  Constructor takes an argument 'store', which is a leveldb style datastore with get, put, del, and batch methods.

Internally, it is dimensionally agnostic and all bboxen are expressed in terms of `[[min1, ...], [max1, ...]]` e.g. `[[west, south], [east, north]]` or  `[[xmin, ymin, zmin], [xmax, ymax, zmax]]`. Just be consistent in your dimensions. You can generate these from geojson with [gbv](https://github.com/calvinmetcalf/geojson-bounding-volume).

Currently features the following methods

```js
rtree.insert('id', bbox, callback);
rtree.remove('id', bbox, callback);
rtree.remove('id', callback);
rtree.query(bbox);// returns stream
rtree.insert('id', bbox, callback);
rtree.query(bbox, cb);// array
rtree.bulk(array, cb);// array members of of the form {id:id, bbox:bbox}
```

All the rtree stores is the id and bbox, any other data you want to store you need to store elsewhere.

todo
====

- Batch deletes.