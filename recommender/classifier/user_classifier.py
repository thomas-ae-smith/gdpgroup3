from __future__ import print_function, division

import cPickle as pickle

import numpy

ML_INPUTS = "data/movielens/ml_data.inputs"
ML_OUTPUTS = "data/movielens/ml_data.outputs"

def classify_user(age, gender):
	"""Given user demographics, returns the initial vector 
	for the users preferences."""

	return _classifications[gender]

def _build_classifications():
	with open(ML_INPUTS) as f_in:
		in_matrix = numpy.array(pickle.load(f_in))
	with open(ML_OUTPUTS) as f_out:
		out_matrix = numpy.array(pickle.load(f_out))

	male_vectors = []
	female_vectors = []
	for i, demographics in enumerate(in_matrix):
		if demographics[1] == 1:
			male_vectors.append(out_matrix[i])
		else:
			female_vectors.append(out_matrix[i])

	m = sum(male_vectors)/len(male_vectors)
	f = sum(female_vectors)/len(female_vectors)

	return {True:m, False:f}

_classifications = _build_classifications()
