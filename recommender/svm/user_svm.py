from __future__ import print_function

import cPickle as pickle
import os.path
import pdb

from PyML import VectorDataSet
from PyML.classifiers.svm import SVR

DEBUG = True
DEFAULT_NO_CACHE = True
ML_INPUTS = "data/movielens/ml_data.inputs"
ML_OUTPUTS = "data/movielens/ml_data.outputs"
SVM_CACHE = os.path.join("cache", "svr_cache")

def classify_user(gender, age):
	"""Given user demographics, returns the initial vector 
	for the users preferences."""
	dataset = VectorDataSet([[age, gender]])

	vector = []
	try:
		for classifier in _svrs:
			vector.append(classifier.classify(dataset, 0))
	except AttributeError as err:
		print("AttributeError; did you forget to train the SVM?")
		pdb.set_trace()

	if DEBUG: pdb.set_trace()

	return vector

def get_datasets():
	"""Returns a tuple (a, b).

	a: a numpy matrix of demographic inputs.
	b: a numpy matrix of training outputs, with positions corresponding to 
	the patterns in `a`."""

	# TODO: Enable caching.

	with open(ML_INPUTS) as inputs_file:
		in_matrix = pickle.load(inputs_file)
	with open(ML_OUTPUTS) as outputs_file:
		out_matrix = pickle.load(outputs_file)

	input_length = len(in_matrix[0].T)
	output_length = len(out_matrix[0].T)

	if DEBUG: pdb.set_trace()

	datasets = []
	for output_index in xrange(output_length):
		L = [v.tolist()[0][output_index] for v in out_matrix]
		dataset = VectorDataSet(in_matrix.tolist(),
								L=L,
								numericLabels=True)
		dataset.normalize()
		datasets.append(dataset)

	return datasets

def retrain():
	"""Retrains the SVM. Only use when the training data has improved, or the 
	representation of the user preference vector has changed."""

	datasets = get_datasets()

	for ds_num, ds in enumerate(datasets):
		_svrs[ds_num].train(ds)
		_svrs[ds_num].save(SVM_CACHE+"."+str(ds_num))

def test(validations=5):
	"""Tests a new set of SVMs using cross-validation on the specified 
	dataset. Saves the test results in a picked array of Results objects: 
	svm_test_results.p."""

	datasets = get_datasets()
	svrs = [SVR() for i in xrange(len(datasets))]

	results = [None] * len(svrs)
	for svr_num, svr in enumerate(svrs):
		results[svr_num] = svr.cv(datasets[svr_num], numFolds=validations)

	with open("svm_test_results.p", "w") as results_f:
		pickle.dump(results, results_f)

def _get_svr(dataset):
	svr = SVR()

	if DEBUG: pdb.set_trace()

	svr.train(dataset)
	return svr

def _get_svrs(no_cache=DEFAULT_NO_CACHE):
	datasets = get_datasets()

	if no_cache:
		return [_get_svr(ds) for ds in datasets]

	svrs = []
	try:
		for ds_num, ds in enumerate(datasets):
			with open(SVM_CACHE+"."+str(ds_num), "r") as cache_f:
				svrs.append(SVR())
				svrs[ds_num].load(cache_f, datasets[ds_num])
	except IOError: # Cache miss; build new SVRs
		for ds in datasets:
			svrs.append(_get_svr(ds))

	return svrs

_svrs = _get_svrs()
