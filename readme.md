async-rtree [![Build Status](https://travis-ci.org/calvinmetcalf/async-rtree.svg)](https://travis-ci.org/calvinmetcalf/async-rtree)
===

An async RTree, suitable for use with levelup, based on [rbush](https://github.com/mourner/rbush).  Constructor takes an argument 'store', which is a leveldb style datastore with get, put, del, and batch methods.

Internally, it is dimensionally agnostic and all bboxen are expressed in terms of `[[min1, ...], [max1, ...]]` e.g. `[[west, south], [east, north]]` or  `[[xmin, ymin, zmin], [xmax, ymax, zmax]]`. Just be consistent in your dimensions. You can generate these from geojson with [gbv](https://github.com/calvinmetcalf/geojson-bounding-volume).

Currently features the following methods

```js
rtree.insert('id', bbox, callback);
rtree.append('id', bbox, callback);
rtree.remove('id', callback);
rtree.remove('id', bbox, callback);
rtree.query(bbox);// returns stream
rtree.query(bbox, cb);// array
rtree.bulk(array, cb);// array members of of the form {id:id, bbox:bbox}
```

All the rtree stores is the id and bbox, any other data you want to store you need to store elsewhere.

The difference between insert and append is that insert will delete anything with the id currently in the database while append doesn't care if there is one already in there.

A bbox is optional when using remove, if it's ommited then the bboxen are looked up, if a bbox is provided it must be exact, the only reason you'd want to do that is if you have multiple nodes with the same id and only want to remove 1.

todo
====

- Batch deletes.