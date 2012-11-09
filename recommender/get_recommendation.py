#!/usr/bin/python2.7

from __future__ import print_function

import argparse
import pdb
import random
import sys
import time

import mysql.connector
import numpy

from datastore.credentials import credentials
from datastore import vector, interface

DEBUG = False
VERBOSE = False

def get_user_vector(user_id):
	query = (	'SELECT `vector` '
				'FROM `users` '
				'WHERE `id` = {id}'.format(
					id=user_id))
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	cursor.execute(query)
	try:
		vector = cursor.next()
	except StopIteration:
		print("No user with the id {id}".format(id=user_id), file=sys.stderr)
		exit(1)

	vector = string_to_vector(vector[0])

	cursor.close()
	conn.close()

	return vector

def get_name(pid):
	query = "SELECT `title` FROM `programme` WHERE `id` = {pid}".format(pid=pid)
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()
	cursor.execute(query)

	try:
		name = cursor.next()[0]
	except StopIteration:
		name = "No programme with id {id}".format(id=pid)

	cursor.close()
	conn.close()

	return name

def get_recommendation(userId, startTime=None, lookahead=300):
	"""Given a userid, returns the programme id for a programme recommended
	by the recommender which starts within the next `lookahead` seconds.
	Returns -1 if there are no programmes in the database which start within
	the required time."""

	if startTime is None:
		startTime = time.time()

	user_vector = vector.string_to_vector(interface.get_user(userId, ['vector'])[0])
	upcoming_programmes = interface.get_broadcast_pool(
							userId,
							startTime=startTime,
							lookahead=lookahead)

	if VERBOSE:
		total_programmes = len(upcoming_programmes)
		distances = []
		vectors = []

	if not upcoming_programmes:
		print("No programmes in the database which start between {start} "
				"and {end}".format(start=startTime, end=startTime+lookahead),
				file=sys.stderr)
		return -1

	best_recommendations = [(float('inf'), -1)]
	for p_id, p_vector in upcoming_programmes:
		if not p_vector:
			print("Programme {pid} does not have a vector!".format(pid=p_id),
					file=sys.stderr)
			continue
		p_vector = vector.string_to_vector(p_vector)
		try:
			diff = user_vector - p_vector
		except ValueError as err:
			# If you've got here, then the vector being written to the database 
			# is probably being truncated in writing. Make sure a full-length
			# vector fits in the varchar length.
			if DEBUG:
				pdb.set_trace()
			raise

		distance = numpy.sqrt(numpy.dot(diff, diff))
		if VERBOSE:
			distances += [distance]
		# If the norm of the difference vector is the smallest so far...
		if distance < best_recommendations[0][0]:
			# ...recommend that programme.
			best_recommendations = [(distance, p_id)]
			if VERBOSE:
				vectors = [p_vector]
		elif distance == best_recommendations[0][0]:
			# Incase of a draw, recommend a random one of the set.
			best_recommendations += [(distance, p_id)]
			if VERBOSE:
				vectors += [p_vector]

	best_index = random.randint(0, len(best_recommendations)-1)
	best_recommendation = best_recommendations[0]

	if VERBOSE:
		print("User vector: {v}".format(v=user_vector))
		print("Closest programme vector: {v}".format(v=vectors[best_index]))
		print("Distance: {d}".format(d=best_recommendation[0]))
		print("Total programmes: {n}".format(n=total_programmes))
		print("Average distance: {d}".format(d=sum(distances)/len(distances)))

	return best_recommendation[1]

def _init_argparse():
	parser = argparse.ArgumentParser(description="Returns a recommended "
		"broadcast id for a particular user which starts within a period of "
		"time. Defaults to within the next 5 minutes from right now. Returns "
		"-1 if no broadcasts exist in the database which start within the "
		"specified time period. Exits with status 1 if the user does not exist "
		"in the users table.")
	parser.add_argument('user_id', metavar='uid', type=int,
						help="The ID of a user")
	parser.add_argument('-t', "--time", type=int, default=None,
		help="A unix timestamp of the lower bound on the start time of a "
		"programme to be recommended")
	parser.add_argument('-l', "--lookahead", type=int, default=300,
		help="The time, in seconds, after --time in which a recommended "
		"programme may start. Defaults to 300 (5 minutes).")
	#parser.add_argument('-n', "--name", action="store_true", help="Returns the "
	#					"name, instead of the id, of the programme.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information to stdout.")
	return parser.parse_args()

# If called from the commandline.
if __name__ == "__main__":
	args = _init_argparse()

	DEBUG = bool(args.debug)
	VERBOSE = bool(args.verbose)

	recommendation = get_recommendation(args.user_id, startTime=args.time,
										lookahead=args.lookahead)
	#if args.name:
	#	recommendation = get_name(recommendation)

	print(str(recommendation), end='')
