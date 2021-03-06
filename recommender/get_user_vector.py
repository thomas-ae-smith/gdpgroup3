#!/usr/bin/python2.7

from __future__ import print_function

import argparse

from datastore.vector import vector_to_string
import classifier.user_classifier

def get_user_vector(age, gender): #, debug=False, verbose=False):
	"""Given user demographics, adds a new user to persistant storage, along
	with a vector representing the users preferences, as returned by the
	SVM"""

	gender = gender == 'm' # True if male

	# Get user vector
	vector = classifier.user_classifier.classify_user(age, gender)
	return vector_to_string(vector)

def _init_argparse():
	parser = argparse.ArgumentParser(description="Adds a new user to the "
		"database along with their preference vector initialised by the "
		"recommender.")
	parser.add_argument('age', metavar='age', type=float, help="The age of the "
						"user in years.")
	parser.add_argument('gender', metavar='gender', type=str, help="The gender "
						"of the user. 'm' if male, 'f' if female.")
	# parser.add_argument('-v', "--verbose", action="store_true",
						# help="Prints more information.")
	# parser.add_argument('-d', "--debug", action="store_true",
						# help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	assert 0 < args.age < 100
	args.gender = args.gender.lower()
	assert args.gender in {'m', 'f'}

	print(get_user_vector(args.age, args.gender), end='')
