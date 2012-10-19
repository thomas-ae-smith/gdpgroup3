#!/usr/bin/python2.7

from __future__ import print_function

import argparse

import mysql.connector

from datastore.credentials import credentials
import svm.user_svm

import pdb

def add_user(gender, age, debug=False):
	"""Given user demographics, adds a new user to persistant storage, along 
	with a vector representing the users preferences, as returned by the 
	SVM"""

	# Get user vector
	vector = svm.user_svm.classify_user([gender, age])
	vector = ", ".join(str(e) for e in vector)

	# Write to DB
	query = ("INSERT INTO users(vector) "
			"VALUES ('{v}')".format(v=vector))

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

# If called from the commandline
if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Adds a new user to the "
		"database along with their preference vector initialised by the "
		"recommender.")
	parser.add_argument('gender', metavar='male', type=bool, help="The gender "
						"of the user. True if male, false if female.")
	parser.add_argument('age', metavar='age', type=int, help="The age of the "
						"user in years.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	args = parser.parse_args()

	add_user(args.gender, args.age, args.debug)
