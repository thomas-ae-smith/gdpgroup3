from __future__ import print_function

from PyML import VectorDataSet
from PyML.classifiers import multi
from PyML.classifiers.svm import SVR
from PyML.containers import Labels

import cPickle as pickle
import pdb

def build_user_preverences(v):
	"""Given a vector `v` of user demographics, returns the initial vector 
	for the users preferences."""
	return None

def retrain():
	"""Retrains the SVM. Only use when the training data has improved, or the 
	representation of the user preference vector has changed."""

	print("Loading inputs...", end="")
	with open("data/movielens-1m/ml_data.inputs") as INPUTS:
		in_matrix = pickle.load(INPUTS)
	print("done.")

	print("Loading outputs...", end="")
	with open("data/movielens-1m/ml_data.outputs") as OUTPUTS:
		out_matrix = pickle.load(OUTPUTS)
	print("done.")

	# For debugging. Remove when actually using.
	in_matrix = in_matrix[0:100]
	out_matrix = out_matrix[0:100]

	input_length = len(in_matrix[0].T)
	output_length = len(out_matrix[0].T)

	svrs = [SVR() for i in xrange(output_length)]

	results = [None] * len(svrs)

	for svr_num, svr in enumerate(svrs):
		print("Training svr ", svr_num, "/", len(svrs), "...", end="")
		data = VectorDataSet(in_matrix.tolist(), L=[v.tolist()[0][svr_num] for v in out_matrix], numericLabels=True)
		data.normalize()
		# svr.train(data)
		results[svr_num] = svr.cv(data)
		print("done.")

	pdb.set_trace()
