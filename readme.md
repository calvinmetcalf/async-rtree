level-tree
===

An async RTree, sutible for use with leveldb, based on [rbush](https://github.com/mourner/rbush).  Constructor takes an argument 'store', which is a leveldb style datastore with get, put, del, batch, and clear methods.