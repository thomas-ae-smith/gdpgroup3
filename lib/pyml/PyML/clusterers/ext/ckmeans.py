# This file was automatically generated by SWIG (http://www.swig.org).
# Version 1.3.31
#
# Don't modify this file, modify the SWIG interface instead.
# This file is compatible with both classic and new-style classes.

import _ckmeans
import new
new_instancemethod = new.instancemethod
try:
    _swig_property = property
except NameError:
    pass # Python < 2.2 doesn't have 'property'.
def _swig_setattr_nondynamic(self,class_type,name,value,static=1):
    if (name == "thisown"): return self.this.own(value)
    if (name == "this"):
        if type(value).__name__ == 'PySwigObject':
            self.__dict__[name] = value
            return
    method = class_type.__swig_setmethods__.get(name,None)
    if method: return method(self,value)
    if (not static) or hasattr(self,name):
        self.__dict__[name] = value
    else:
        raise AttributeError("You cannot add attributes to %s" % self)

def _swig_setattr(self,class_type,name,value):
    return _swig_setattr_nondynamic(self,class_type,name,value,0)

def _swig_getattr(self,class_type,name):
    if (name == "thisown"): return self.this.own()
    method = class_type.__swig_getmethods__.get(name,None)
    if method: return method(self)
    raise AttributeError,name

def _swig_repr(self):
    try: strthis = "proxy of " + self.this.__repr__()
    except: strthis = ""
    return "<%s.%s; %s >" % (self.__class__.__module__, self.__class__.__name__, strthis,)

import types
try:
    _object = types.ObjectType
    _newclass = 1
except AttributeError:
    class _object : pass
    _newclass = 0
del types


class PySwigIterator(_object):
    __swig_setmethods__ = {}
    __setattr__ = lambda self, name, value: _swig_setattr(self, PySwigIterator, name, value)
    __swig_getmethods__ = {}
    __getattr__ = lambda self, name: _swig_getattr(self, PySwigIterator, name)
    def __init__(self): raise AttributeError, "No constructor defined"
    __repr__ = _swig_repr
    __swig_destroy__ = _ckmeans.delete_PySwigIterator
    __del__ = lambda self : None;
    def value(*args): return _ckmeans.PySwigIterator_value(*args)
    def incr(*args): return _ckmeans.PySwigIterator_incr(*args)
    def decr(*args): return _ckmeans.PySwigIterator_decr(*args)
    def distance(*args): return _ckmeans.PySwigIterator_distance(*args)
    def equal(*args): return _ckmeans.PySwigIterator_equal(*args)
    def copy(*args): return _ckmeans.PySwigIterator_copy(*args)
    def next(*args): return _ckmeans.PySwigIterator_next(*args)
    def previous(*args): return _ckmeans.PySwigIterator_previous(*args)
    def advance(*args): return _ckmeans.PySwigIterator_advance(*args)
    def __eq__(*args): return _ckmeans.PySwigIterator___eq__(*args)
    def __ne__(*args): return _ckmeans.PySwigIterator___ne__(*args)
    def __iadd__(*args): return _ckmeans.PySwigIterator___iadd__(*args)
    def __isub__(*args): return _ckmeans.PySwigIterator___isub__(*args)
    def __add__(*args): return _ckmeans.PySwigIterator___add__(*args)
    def __sub__(*args): return _ckmeans.PySwigIterator___sub__(*args)
    def __iter__(self): return self
PySwigIterator_swigregister = _ckmeans.PySwigIterator_swigregister
PySwigIterator_swigregister(PySwigIterator)

class IntVector(_object):
    __swig_setmethods__ = {}
    __setattr__ = lambda self, name, value: _swig_setattr(self, IntVector, name, value)
    __swig_getmethods__ = {}
    __getattr__ = lambda self, name: _swig_getattr(self, IntVector, name)
    __repr__ = _swig_repr
    def iterator(*args): return _ckmeans.IntVector_iterator(*args)
    def __iter__(self): return self.iterator()
    def __nonzero__(*args): return _ckmeans.IntVector___nonzero__(*args)
    def __len__(*args): return _ckmeans.IntVector___len__(*args)
    def pop(*args): return _ckmeans.IntVector_pop(*args)
    def __getslice__(*args): return _ckmeans.IntVector___getslice__(*args)
    def __setslice__(*args): return _ckmeans.IntVector___setslice__(*args)
    def __delslice__(*args): return _ckmeans.IntVector___delslice__(*args)
    def __delitem__(*args): return _ckmeans.IntVector___delitem__(*args)
    def __getitem__(*args): return _ckmeans.IntVector___getitem__(*args)
    def __setitem__(*args): return _ckmeans.IntVector___setitem__(*args)
    def append(*args): return _ckmeans.IntVector_append(*args)
    def empty(*args): return _ckmeans.IntVector_empty(*args)
    def size(*args): return _ckmeans.IntVector_size(*args)
    def clear(*args): return _ckmeans.IntVector_clear(*args)
    def swap(*args): return _ckmeans.IntVector_swap(*args)
    def get_allocator(*args): return _ckmeans.IntVector_get_allocator(*args)
    def begin(*args): return _ckmeans.IntVector_begin(*args)
    def end(*args): return _ckmeans.IntVector_end(*args)
    def rbegin(*args): return _ckmeans.IntVector_rbegin(*args)
    def rend(*args): return _ckmeans.IntVector_rend(*args)
    def pop_back(*args): return _ckmeans.IntVector_pop_back(*args)
    def erase(*args): return _ckmeans.IntVector_erase(*args)
    def __init__(self, *args): 
        this = _ckmeans.new_IntVector(*args)
        try: self.this.append(this)
        except: self.this = this
    def push_back(*args): return _ckmeans.IntVector_push_back(*args)
    def front(*args): return _ckmeans.IntVector_front(*args)
    def back(*args): return _ckmeans.IntVector_back(*args)
    def assign(*args): return _ckmeans.IntVector_assign(*args)
    def resize(*args): return _ckmeans.IntVector_resize(*args)
    def insert(*args): return _ckmeans.IntVector_insert(*args)
    def reserve(*args): return _ckmeans.IntVector_reserve(*args)
    def capacity(*args): return _ckmeans.IntVector_capacity(*args)
    __swig_destroy__ = _ckmeans.delete_IntVector
    __del__ = lambda self : None;
IntVector_swigregister = _ckmeans.IntVector_swigregister
IntVector_swigregister(IntVector)

class DoubleVector(_object):
    __swig_setmethods__ = {}
    __setattr__ = lambda self, name, value: _swig_setattr(self, DoubleVector, name, value)
    __swig_getmethods__ = {}
    __getattr__ = lambda self, name: _swig_getattr(self, DoubleVector, name)
    __repr__ = _swig_repr
    def iterator(*args): return _ckmeans.DoubleVector_iterator(*args)
    def __iter__(self): return self.iterator()
    def __nonzero__(*args): return _ckmeans.DoubleVector___nonzero__(*args)
    def __len__(*args): return _ckmeans.DoubleVector___len__(*args)
    def pop(*args): return _ckmeans.DoubleVector_pop(*args)
    def __getslice__(*args): return _ckmeans.DoubleVector___getslice__(*args)
    def __setslice__(*args): return _ckmeans.DoubleVector___setslice__(*args)
    def __delslice__(*args): return _ckmeans.DoubleVector___delslice__(*args)
    def __delitem__(*args): return _ckmeans.DoubleVector___delitem__(*args)
    def __getitem__(*args): return _ckmeans.DoubleVector___getitem__(*args)
    def __setitem__(*args): return _ckmeans.DoubleVector___setitem__(*args)
    def append(*args): return _ckmeans.DoubleVector_append(*args)
    def empty(*args): return _ckmeans.DoubleVector_empty(*args)
    def size(*args): return _ckmeans.DoubleVector_size(*args)
    def clear(*args): return _ckmeans.DoubleVector_clear(*args)
    def swap(*args): return _ckmeans.DoubleVector_swap(*args)
    def get_allocator(*args): return _ckmeans.DoubleVector_get_allocator(*args)
    def begin(*args): return _ckmeans.DoubleVector_begin(*args)
    def end(*args): return _ckmeans.DoubleVector_end(*args)
    def rbegin(*args): return _ckmeans.DoubleVector_rbegin(*args)
    def rend(*args): return _ckmeans.DoubleVector_rend(*args)
    def pop_back(*args): return _ckmeans.DoubleVector_pop_back(*args)
    def erase(*args): return _ckmeans.DoubleVector_erase(*args)
    def __init__(self, *args): 
        this = _ckmeans.new_DoubleVector(*args)
        try: self.this.append(this)
        except: self.this = this
    def push_back(*args): return _ckmeans.DoubleVector_push_back(*args)
    def front(*args): return _ckmeans.DoubleVector_front(*args)
    def back(*args): return _ckmeans.DoubleVector_back(*args)
    def assign(*args): return _ckmeans.DoubleVector_assign(*args)
    def resize(*args): return _ckmeans.DoubleVector_resize(*args)
    def insert(*args): return _ckmeans.DoubleVector_insert(*args)
    def reserve(*args): return _ckmeans.DoubleVector_reserve(*args)
    def capacity(*args): return _ckmeans.DoubleVector_capacity(*args)
    __swig_destroy__ = _ckmeans.delete_DoubleVector
    __del__ = lambda self : None;
DoubleVector_swigregister = _ckmeans.DoubleVector_swigregister
DoubleVector_swigregister(DoubleVector)

class Kmeans(_object):
    __swig_setmethods__ = {}
    __setattr__ = lambda self, name, value: _swig_setattr(self, Kmeans, name, value)
    __swig_getmethods__ = {}
    __getattr__ = lambda self, name: _swig_getattr(self, Kmeans, name)
    __repr__ = _swig_repr
    def __init__(self, *args): 
        this = _ckmeans.new_Kmeans(*args)
        try: self.this.append(this)
        except: self.this = this
    __swig_setmethods__["k"] = _ckmeans.Kmeans_k_set
    __swig_getmethods__["k"] = _ckmeans.Kmeans_k_get
    if _newclass:k = _swig_property(_ckmeans.Kmeans_k_get, _ckmeans.Kmeans_k_set)
    __swig_setmethods__["max_iterations"] = _ckmeans.Kmeans_max_iterations_set
    __swig_getmethods__["max_iterations"] = _ckmeans.Kmeans_max_iterations_get
    if _newclass:max_iterations = _swig_property(_ckmeans.Kmeans_max_iterations_get, _ckmeans.Kmeans_max_iterations_set)
    __swig_setmethods__["cluster_membership"] = _ckmeans.Kmeans_cluster_membership_set
    __swig_getmethods__["cluster_membership"] = _ckmeans.Kmeans_cluster_membership_get
    if _newclass:cluster_membership = _swig_property(_ckmeans.Kmeans_cluster_membership_get, _ckmeans.Kmeans_cluster_membership_set)
    __swig_setmethods__["clusters"] = _ckmeans.Kmeans_clusters_set
    __swig_getmethods__["clusters"] = _ckmeans.Kmeans_clusters_get
    if _newclass:clusters = _swig_property(_ckmeans.Kmeans_clusters_get, _ckmeans.Kmeans_clusters_set)
    def similarity_to_cluster(*args): return _ckmeans.Kmeans_similarity_to_cluster(*args)
    def move(*args): return _ckmeans.Kmeans_move(*args)
    def initialize_clusters(*args): return _ckmeans.Kmeans_initialize_clusters(*args)
    def show(*args): return _ckmeans.Kmeans_show(*args)
    def train(*args): return _ckmeans.Kmeans_train(*args)
    def test(*args): return _ckmeans.Kmeans_test(*args)
    __swig_destroy__ = _ckmeans.delete_Kmeans
    __del__ = lambda self : None;
Kmeans_swigregister = _ckmeans.Kmeans_swigregister
Kmeans_swigregister(Kmeans)



