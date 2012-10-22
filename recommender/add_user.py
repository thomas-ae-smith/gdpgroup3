#!/usr/bin/python2.7

from __future__ import print_function

import argparse

import mysql.connector

from datastore.credentials import credentials
from datastore.vector import vector_to_string
import classifier.user_classifier # import svm.user_svm

import pdb

MAX_NAME_LENGTH = 70

def add_user(age, gender, name, debug=False, verbose=False):
	"""Given user demographics, adds a new user to persistant storage, along 
	with a vector representing the users preferences, as returned by the 
	SVM"""

	gender = gender == 'm' # True if male

	# Get user vector
	# vector = svm.user_svm.classify_user(age, gender)
	vector = classifier.user_classifier.classify_user(age, gender)
	vector = vector_to_string(vector)

	# Write to DB
	query = ("INSERT INTO users(name, vector) "
			"VALUES ('{name}', '{v}')".format(name=name, v=vector))

	try:
		conn = mysql.connector.connect(user=credentials['username'],
									password=credentials['password'],
									database=credentials['db'],
									host=credentials['host'],
									port=credentials['port'])
	except mysql.connector.errors.InterfaceError as err:
		if debug:
			pdb.set_trace()
		else:
			raise

	cursor = conn.cursor()
	cursor.execute(query)

	conn.commit()
	cursor.close()
	conn.close()

	if verbose:
		print("Added user with vector: "+vector)

def _init_argparse():
	parser = argparse.ArgumentParser(description="Adds a new user to the "
		"database along with their preference vector initialised by the "
		"recommender.")
	parser.add_argument('age', metavar='age', type=float, help="The age of the "
						"user in years.")
	parser.add_argument('gender', metavar='gender', type=str, help="The gender "
						"of the user. 'm' if male, 'f' if female.")
	parser.add_argument('name', metavar='name', type=str,
						help="The users name.")
	#TODO: parser.add_argument('-f', "--force", action="store_true",
						# help="If true, munges inputs so the entry IS entered "
						# "into the database (names are truncated, etc).")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	assert 0 < args.age < 100
	args.gender = args.gender.lower()
	assert args.gender in {'m', 'f'}
	assert 0 < len(args.name) <= MAX_NAME_LENGTH

	add_user(args.age, args.gender, args.name, args.debug, args.verbose)
