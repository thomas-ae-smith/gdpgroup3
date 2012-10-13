#line 1 "numpy/core/src/multiarray/multiarray_tests.c.src"

/*
 *****************************************************************************
 **       This file was autogenerated from a template  DO NOT EDIT!!!!      **
 **       Changes should be made to the original source (.src) file         **
 *****************************************************************************
 */

#line 1
#define NPY_NO_DEPRECATED_API NPY_API_VERSION
#include <Python.h>
#include "numpy/arrayobject.h"

#include "npy_pycompat.h"

/*
 * TODO:
 *  - Handle mode
 */

#line 17
static int copy_double(PyArrayIterObject *itx, PyArrayNeighborhoodIterObject *niterx,
        npy_intp *bounds,
        PyObject **out)
{
    npy_intp i, j;
    npy_double *ptr;
    npy_intp odims[NPY_MAXDIMS];
    PyArrayObject *aout;

    /*
     * For each point in itx, copy the current neighborhood into an array which
     * is appended at the output list
     */
    for (i = 0; i < itx->size; ++i) {
        PyArrayNeighborhoodIter_Reset(niterx);

        for (j = 0; j < PyArray_NDIM(itx->ao); ++j) {
            odims[j] = bounds[2 * j + 1] - bounds[2 * j] + 1;
        }
        aout = (PyArrayObject*)PyArray_SimpleNew(
                                PyArray_NDIM(itx->ao), odims, NPY_DOUBLE);
        if (aout == NULL) {
            return -1;
        }

        ptr = (npy_double*)PyArray_DATA(aout);

        for (j = 0; j < niterx->size; ++j) {
            *ptr = *((npy_double*)niterx->dataptr);
            PyArrayNeighborhoodIter_Next(niterx);
            ptr += 1;
        }

        PyList_Append(*out, (PyObject*)aout);
        Py_DECREF(aout);
        PyArray_ITER_NEXT(itx);
    }

    return 0;
}

#line 17
static int copy_int(PyArrayIterObject *itx, PyArrayNeighborhoodIterObject *niterx,
        npy_intp *bounds,
        PyObject **out)
{
    npy_intp i, j;
    npy_int *ptr;
    npy_intp odims[NPY_MAXDIMS];
    PyArrayObject *aout;

    /*
     * For each point in itx, copy the current neighborhood into an array which
     * is appended at the output list
     */
    for (i = 0; i < itx->size; ++i) {
        PyArrayNeighborhoodIter_Reset(niterx);

        for (j = 0; j < PyArray_NDIM(itx->ao); ++j) {
            odims[j] = bounds[2 * j + 1] - bounds[2 * j] + 1;
        }
        aout = (PyArrayObject*)PyArray_SimpleNew(
                                PyArray_NDIM(itx->ao), odims, NPY_INT);
        if (aout == NULL) {
            return -1;
        }

        ptr = (npy_int*)PyArray_DATA(aout);

        for (j = 0; j < niterx->size; ++j) {
            *ptr = *((npy_int*)niterx->dataptr);
            PyArrayNeighborhoodIter_Next(niterx);
            ptr += 1;
        }

        PyList_Append(*out, (PyObject*)aout);
        Py_DECREF(aout);
        PyArray_ITER_NEXT(itx);
    }

    return 0;
}


static int copy_object(PyArrayIterObject *itx, PyArrayNeighborhoodIterObject *niterx,
        npy_intp *bounds,
        PyObject **out)
{
    npy_intp i, j;
    npy_intp odims[NPY_MAXDIMS];
    PyArrayObject *aout;
    PyArray_CopySwapFunc *copyswap = PyArray_DESCR(itx->ao)->f->copyswap;
    npy_int itemsize = PyArray_ITEMSIZE(itx->ao);

    /*
     * For each point in itx, copy the current neighborhood into an array which
     * is appended at the output list
     */
    for (i = 0; i < itx->size; ++i) {
        PyArrayNeighborhoodIter_Reset(niterx);

        for (j = 0; j < PyArray_NDIM(itx->ao); ++j) {
            odims[j] = bounds[2 * j + 1] - bounds[2 * j] + 1;
        }
        aout = (PyArrayObject*)PyArray_SimpleNew(PyArray_NDIM(itx->ao), odims, NPY_OBJECT);
        if (aout == NULL) {
            return -1;
        }

        for (j = 0; j < niterx->size; ++j) {
            copyswap(PyArray_DATA(aout) + j * itemsize, niterx->dataptr, 0, NULL);
            PyArrayNeighborhoodIter_Next(niterx);
        }

        PyList_Append(*out, (PyObject*)aout);
        Py_DECREF(aout);
        PyArray_ITER_NEXT(itx);
    }

    return 0;
}

static PyObject*
test_neighborhood_iterator(PyObject* NPY_UNUSED(self), PyObject* args)
{
    PyObject *x, *fill, *out, *b;
    PyArrayObject *ax, *afill;
    PyArrayIterObject *itx;
    int i, typenum, mode, st;
    npy_intp bounds[NPY_MAXDIMS*2];
    PyArrayNeighborhoodIterObject *niterx;

    if (!PyArg_ParseTuple(args, "OOOi", &x, &b, &fill, &mode)) {
        return NULL;
    }

    if (!PySequence_Check(b)) {
        return NULL;
    }

    typenum = PyArray_ObjectType(x, 0);
    typenum = PyArray_ObjectType(fill, typenum);

    ax = (PyArrayObject*)PyArray_FromObject(x, typenum, 1, 10);
    if (ax == NULL) {
        return NULL;
    }
    if (PySequence_Size(b) != 2 * PyArray_NDIM(ax)) {
        PyErr_SetString(PyExc_ValueError,
                "bounds sequence size not compatible with x input");
        goto clean_ax;
    }

    out = PyList_New(0);
    if (out == NULL) {
        goto clean_ax;
    }

    itx = (PyArrayIterObject*)PyArray_IterNew(x);
    if (itx == NULL) {
        goto clean_out;
    }

    /* Compute boundaries for the neighborhood iterator */
    for (i = 0; i < 2 * PyArray_NDIM(ax); ++i) {
        PyObject* bound;
        bound = PySequence_GetItem(b, i);
        if (bounds == NULL) {
            goto clean_itx;
        }
        if (!PyInt_Check(bound)) {
            PyErr_SetString(PyExc_ValueError,
                    "bound not long");
            Py_DECREF(bound);
            goto clean_itx;
        }
        bounds[i] = PyInt_AsLong(bound);
        Py_DECREF(bound);
    }

    /* Create the neighborhood iterator */
    afill = NULL;
    if (mode == NPY_NEIGHBORHOOD_ITER_CONSTANT_PADDING) {
            afill = (PyArrayObject *)PyArray_FromObject(fill, typenum, 0, 0);
            if (afill == NULL) {
            goto clean_itx;
        }
    }

    niterx = (PyArrayNeighborhoodIterObject*)PyArray_NeighborhoodIterNew(
                    (PyArrayIterObject*)itx, bounds, mode, afill);
    if (niterx == NULL) {
        goto clean_afill;
    }

    switch (typenum) {
        case NPY_OBJECT:
            st = copy_object(itx, niterx, bounds, &out);
            break;
        case NPY_INT:
            st = copy_int(itx, niterx, bounds, &out);
            break;
        case NPY_DOUBLE:
            st = copy_double(itx, niterx, bounds, &out);
            break;
        default:
            PyErr_SetString(PyExc_ValueError,
                    "Type not supported");
            goto clean_niterx;
    }

    if (st) {
        goto clean_niterx;
    }

    Py_DECREF(niterx);
    Py_XDECREF(afill);
    Py_DECREF(itx);

    Py_DECREF(ax);

    return out;

clean_niterx:
    Py_DECREF(niterx);
clean_afill:
    Py_XDECREF(afill);
clean_itx:
    Py_DECREF(itx);
clean_out:
    Py_DECREF(out);
clean_ax:
    Py_DECREF(ax);
    return NULL;
}

static int
copy_double_double(PyArrayNeighborhoodIterObject *itx,
        PyArrayNeighborhoodIterObject *niterx,
        npy_intp *bounds,
        PyObject **out)
{
    npy_intp i, j;
    double *ptr;
    npy_intp odims[NPY_MAXDIMS];
    PyArrayObject *aout;

    /*
     * For each point in itx, copy the current neighborhood into an array which
     * is appended at the output list
     */
    PyArrayNeighborhoodIter_Reset(itx);
    for (i = 0; i < itx->size; ++i) {
        for (j = 0; j < PyArray_NDIM(itx->ao); ++j) {
            odims[j] = bounds[2 * j + 1] - bounds[2 * j] + 1;
        }
        aout = (PyArrayObject*)PyArray_SimpleNew(
                            PyArray_NDIM(itx->ao), odims, NPY_DOUBLE);
        if (aout == NULL) {
            return -1;
        }

        ptr = (double*)PyArray_DATA(aout);

        PyArrayNeighborhoodIter_Reset(niterx);
        for (j = 0; j < niterx->size; ++j) {
            *ptr = *((double*)niterx->dataptr);
            ptr += 1;
            PyArrayNeighborhoodIter_Next(niterx);
        }
        PyList_Append(*out, (PyObject*)aout);
        Py_DECREF(aout);
        PyArrayNeighborhoodIter_Next(itx);
    }
    return 0;
}

static PyObject*
test_neighborhood_iterator_oob(PyObject* NPY_UNUSED(self), PyObject* args)
{
    PyObject *x, *out, *b1, *b2;
    PyArrayObject *ax;
    PyArrayIterObject *itx;
    int i, typenum, mode1, mode2, st;
    npy_intp bounds[NPY_MAXDIMS*2];
    PyArrayNeighborhoodIterObject *niterx1, *niterx2;

    if (!PyArg_ParseTuple(args, "OOiOi", &x, &b1, &mode1, &b2, &mode2)) {
        return NULL;
    }

    if (!PySequence_Check(b1) || !PySequence_Check(b2)) {
        return NULL;
    }

    typenum = PyArray_ObjectType(x, 0);

    ax = (PyArrayObject*)PyArray_FromObject(x, typenum, 1, 10);
    if (ax == NULL) {
        return NULL;
    }
    if (PySequence_Size(b1) != 2 * PyArray_NDIM(ax)) {
        PyErr_SetString(PyExc_ValueError,
                "bounds sequence 1 size not compatible with x input");
        goto clean_ax;
    }
    if (PySequence_Size(b2) != 2 * PyArray_NDIM(ax)) {
        PyErr_SetString(PyExc_ValueError,
                "bounds sequence 2 size not compatible with x input");
        goto clean_ax;
    }

    out = PyList_New(0);
    if (out == NULL) {
        goto clean_ax;
    }

    itx = (PyArrayIterObject*)PyArray_IterNew(x);
    if (itx == NULL) {
        goto clean_out;
    }

    /* Compute boundaries for the neighborhood iterator */
    for (i = 0; i < 2 * PyArray_NDIM(ax); ++i) {
        PyObject* bound;
        bound = PySequence_GetItem(b1, i);
        if (bounds == NULL) {
            goto clean_itx;
        }
        if (!PyInt_Check(bound)) {
            PyErr_SetString(PyExc_ValueError,
                    "bound not long");
            Py_DECREF(bound);
            goto clean_itx;
        }
        bounds[i] = PyInt_AsLong(bound);
        Py_DECREF(bound);
    }

    /* Create the neighborhood iterator */
    niterx1 = (PyArrayNeighborhoodIterObject*)PyArray_NeighborhoodIterNew(
                    (PyArrayIterObject*)itx, bounds,
                    mode1, NULL);
    if (niterx1 == NULL) {
        goto clean_out;
    }

    for (i = 0; i < 2 * PyArray_NDIM(ax); ++i) {
        PyObject* bound;
        bound = PySequence_GetItem(b2, i);
        if (bounds == NULL) {
            goto clean_itx;
        }
        if (!PyInt_Check(bound)) {
            PyErr_SetString(PyExc_ValueError,
                    "bound not long");
            Py_DECREF(bound);
            goto clean_itx;
        }
        bounds[i] = PyInt_AsLong(bound);
        Py_DECREF(bound);
    }

    niterx2 = (PyArrayNeighborhoodIterObject*)PyArray_NeighborhoodIterNew(
                    (PyArrayIterObject*)niterx1, bounds,
                    mode2, NULL);
    if (niterx1 == NULL) {
        goto clean_niterx1;
    }

    switch (typenum) {
        case NPY_DOUBLE:
            st = copy_double_double(niterx1, niterx2, bounds, &out);
            break;
        default:
            PyErr_SetString(PyExc_ValueError,
                    "Type not supported");
            goto clean_niterx2;
    }

    if (st) {
        goto clean_niterx2;
    }

    Py_DECREF(niterx2);
    Py_DECREF(niterx1);
    Py_DECREF(itx);
    Py_DECREF(ax);
    return out;

clean_niterx2:
    Py_DECREF(niterx2);
clean_niterx1:
    Py_DECREF(niterx1);
clean_itx:
    Py_DECREF(itx);
clean_out:
    Py_DECREF(out);
clean_ax:
    Py_DECREF(ax);
    return NULL;
}

/* PyDataMem_SetHook tests */
static int malloc_free_counts[2];
static PyDataMem_EventHookFunc *old_hook = NULL;
static void *old_data;

static void test_hook(void *old, void *new, size_t size, void *user_data)
{
    int* counters = (int *) user_data;
    if (old == NULL) {
        counters[0]++; /* malloc counter */
    }
    if (size == 0) {
        counters[1]++; /* free counter */
    }
}

static PyObject*
test_pydatamem_seteventhook_start(PyObject* NPY_UNUSED(self), PyObject* NPY_UNUSED(args))
{
    malloc_free_counts[0] = malloc_free_counts[1] = 0;
    old_hook = PyDataMem_SetEventHook(test_hook, (void *) malloc_free_counts, &old_data);
    Py_INCREF(Py_None);
    return Py_None;
}

static PyObject*
test_pydatamem_seteventhook_end(PyObject* NPY_UNUSED(self), PyObject* NPY_UNUSED(args))
{
    PyDataMem_EventHookFunc *my_hook;
    void *my_data;

    my_hook = PyDataMem_SetEventHook(old_hook, old_data, &my_data);
    if ((my_hook != test_hook) || (my_data != (void *) malloc_free_counts)) {
        PyErr_SetString(PyExc_ValueError,
                        "hook/data was not the expected test hook");
        return NULL;
    }

    if (malloc_free_counts[0] == 0) {
        PyErr_SetString(PyExc_ValueError,
                        "malloc count is zero after test");
        return NULL;
    }
    if (malloc_free_counts[1] == 0) {
        PyErr_SetString(PyExc_ValueError,
                        "free count is zero after test");
        return NULL;
    }

    Py_INCREF(Py_None);
    return Py_None;
}

static PyMethodDef Multiarray_TestsMethods[] = {
    {"test_neighborhood_iterator",
        test_neighborhood_iterator,
        METH_VARARGS, NULL},
    {"test_neighborhood_iterator_oob",
        test_neighborhood_iterator_oob,
        METH_VARARGS, NULL},
    {"test_pydatamem_seteventhook_start",
        test_pydatamem_seteventhook_start,
        METH_NOARGS, NULL},
    {"test_pydatamem_seteventhook_end",
        test_pydatamem_seteventhook_end,
        METH_NOARGS, NULL},
    {NULL, NULL, 0, NULL}        /* Sentinel */
};


#if defined(NPY_PY3K)
static struct PyModuleDef moduledef = {
        PyModuleDef_HEAD_INIT,
        "multiarray_tests",
        NULL,
        -1,
        Multiarray_TestsMethods,
        NULL,
        NULL,
        NULL,
        NULL
};
#endif

#if defined(NPY_PY3K)
#define RETVAL m
PyMODINIT_FUNC PyInit_multiarray_tests(void)
#else
#define RETVAL
PyMODINIT_FUNC
initmultiarray_tests(void)
#endif
{
    PyObject *m;

#if defined(NPY_PY3K)
    m = PyModule_Create(&moduledef);
#else
    m = Py_InitModule("multiarray_tests", Multiarray_TestsMethods);
#endif
    if (m == NULL) {
        return RETVAL;
    }
    import_array();
    if (PyErr_Occurred()) {
        PyErr_SetString(PyExc_RuntimeError,
                        "cannot load umath_tests module.");
    }
    return RETVAL;
}

