#!/usr/bin/python2.7

from __future__ import division, print_function

import argparse
import pdb
from random import choice
import sys

import mysql.connector
import numpy

from datastore import interface, vector

LEARNING_RATE = 0.25 # Between 0 and 1

def add_rating(user, programme, rating, debug=False, verbose=False, quiet=False):
	# Fetch user vector
	user_vector = interface.get_user(user, ['vector'])
	if not user_vector:
		if debug:
			pdb.set_trace()
		else:
			raise Exception("No vector returned for user {u}; do they "
							"exist?".format(u=user))
	user_vector = vector.string_to_vector(user_vector)
	if verbose:
		print("User vector: {v}".format(v=user_vector))

	# Fetch programme vector
	programme_vector = interface.get_programme(programme, ['vector'])
	if not programme_vector:
		if debug:
			pdb.set_trace()
		else:
			raise Exception("No vector returned for programme {p}; does it "
							"exist?".format(p=programme))
	programme_vector = vector.string_to_vector(programme_vector)
	if verbose:
		print("Programme vector: {v}".format(v=programme_vector))

	# Calculate new user vector
	next_vector = user_vector
	for i in xrange(len(user_vector)):
		if user_vector[i] == programme_vector[i]:
			# In-case the user and programme vectors are identical.
			next_vector[i] += choice((LEARNING_RATE, -LEARNING_RATE))
			next_vector[i] = min(1., max(0., next_vector[i]))
		else:
			distance = abs(user_vector[i] - programme_vector[i])
			if rating > 0:
				distance_to_move = distance*LEARNING_RATE*rating
			else:
				distance_to_move = LEARNING_RATE - (distance*LEARNING_RATE*rating)
			direction_to_move = (programme_vector[i] - user_vector[i]) / distance
			next_vector[i] += distance_to_move * direction_to_move
		if next_vector[i] > 1 and debug:
			pdb.set_trace() # A user has a dimension greater than 1; this shouldn't happen.
	if verbose:
		print("New user vector: {v}".format(v=next_vector))

	# Write new vector to db
	interface.set_user(user, ['vector'], [vector.vector_to_string(next_vector)])

def _init_argparse():
	parser = argparse.ArgumentParser(description="Declare that a user has "
		"rated a prgramme, and adjust the users vector accordingly as well as "
		"adding the programme to the users blacklist.")
	parser.add_argument('userid', metavar='userid', type=int, help="The is of "
						"the user in the local datastore.")
	parser.add_argument('programmeid', metavar='programmeid', type=int,
						help="The id of the programme rated.")
	parser.add_argument('rating', metavar='rating', type=float,
						help="The rating given between -1 and 1, where 1 is the "
						"most positive possible rating, and -1 is the least positive.")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	assert -1 <= args.rating <= 1

	add_rating(args.userid, args.programmeid, args.rating, debug=args.debug,
				verbose=args.verbose)
