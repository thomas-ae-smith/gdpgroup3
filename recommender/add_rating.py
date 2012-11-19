#!/usr/bin/python2.7

from __future__ import division, print_function

import argparse
import pdb
from random import choice
import sys

import numpy

from datastore import interface, vector

DEBUG = False
DRY_RUN = False
VERBOSE = False

LEARNING_RATE = 0.25 # Between 0 and 1

def add_rating(user, programme, rating):
	# Fetch user vector
	user_vector = interface.get_user(user, ['vector'])[0]
	if not user_vector:
		if DEBUG:
			pdb.set_trace()
		else:
			raise Exception("No vector returned for user {u}; do they "
							"exist?".format(u=user))
	user_vector = vector.string_to_vector(user_vector)
	if VERBOSE:
		print("User vector: {v}".format(v=user_vector))

	# Fetch programme vector
	programme_vector = interface.get_programme_vector(programme)
	if not programme_vector:
		if DEBUG:
			pdb.set_trace()
		else:
			raise Exception("No vector returned for programme {p}; does it "
							"exist?".format(p=programme))
	programme_vector = vector.string_to_vector(programme_vector)
	if VERBOSE:
		print("Programme vector: {v}".format(v=programme_vector))

	# Calculate new user vector
	next_vector = user_vector
	for i in xrange(len(user_vector)): # For each dimension...
		distance = abs(user_vector[i] - programme_vector[i])

		# Move a magnitude relative to the rating and distance to rated programme.
		if rating >= 0:
			distance_to_move = distance*LEARNING_RATE*rating
		else:
			distance_to_move = (1-distance)*LEARNING_RATE*rating

		# Move a direction depending on the position of the user vector and 
		# programme vector.
		if distance > 0:
			# Should always be of unitary magnitude:
			direction_to_move = (programme_vector[i] - user_vector[i]) / distance 
		else:
			# In-case distance is 0:
			direction_to_move = -1
			# Don't need to cover positive rating case because distance_to_move
			# will be 0 anyway.

		next_vector[i] += distance_to_move * direction_to_move

		# Restrict value to interval [0,1]. This shouldn't happen anyway, but
		# careful is good.
		if not (0 <= next_vector[i] <= 1):
			if VERBOSE:
				print("A user had a dimension go outside of [0,1]!")
			if DEBUG:
				pdb.set_trace()
			next_vector[i] = min(1, max(0, next_vector[i]))

	if VERBOSE:
		print("New user vector: {v}".format(v=next_vector))

	if not DRY_RUN:
		# Write new vector to db
		interface.set_user(user, ['vector'], [vector.vector_to_string(next_vector)])
	else:
		return vector.vector_to_string(next_vector)

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
	parser.add_argument('-D', "--dry_run", action="store_true",
						help="Performs a dry run; does not save the new vector "
						"to the database, only returns it.")
	return parser.parse_args()

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	assert -1 <= args.rating <= 1

	DEBUG = bool(args.debug)
	VERBOSE = bool(args.verbose)
	DRY_RUN = bool(args.dry_run)

	if DRY_RUN:
		print(add_rating(args.userid, args.programmeid, args.rating))
	else:
		add_rating(args.userid, args.programmeid, args.rating)
