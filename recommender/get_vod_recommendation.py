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
		name = interface.read_db(
			"SELECT `brand`.`title` "
			"FROM `programme` "
			"LEFT JOIN `brand` "
			"ON `brand`.`id` = `programme`.`brand_id` "
			"WHERE `programme`.`id` = {pid}".format(pid=pid))[0][0]
	except StopIteration:
		name = "No programme with id {id}".format(id=pid)

	return name

def get_vod_recommendation(userId):
	"""Given a userid, returns the programme id for a vod programme recommended
	by the recommender. Returns -1 if there are no programmes in the database"""

	user_vector = vector.string_to_vector(interface.get_user(userId, ['vector'])[0])
	query = ("SELECT `p`.`id`, `b`.`vector` "
			"FROM `programme` as `p` "
			"LEFT JOIN `brand` AS `b` "
			"ON `b`.`id` = `p`.`brand_id` "
			"WHERE `p`.`id` NOT IN ( "
				"SELECT `programme_id` "
				"FROM `blacklist_programme` "
				"WHERE `user_id`={uid}) "
			"AND `p`.`recordState` = 2").format(uid=userId)
	programmes = interface.read_db(query)

	if VERBOSE:
		total_programmes = len(programmes)
		distances = []
		vectors = []

	if not programmes:
		print("No programmes found in the database!",
				file=sys.stderr)
		return -1

	best_recommendations = [(float('inf'), -1)]
	for p_id, p_vector in programmes:
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
	best_recommendation = best_recommendations[best_index]

	if VERBOSE:
		print("User vector: {v}".format(v=user_vector))
		print("Closest programme vector: {v}".format(v=vectors[best_index]))
		print("Distance: {d}".format(d=best_recommendation[0]))
		print("Programmes tied for best: {n}".format(n=len(best_recommendations)))
		print("Total programmes: {n}".format(n=total_programmes))
		print("Average distance: {d}".format(d=sum(distances)/len(distances)))

	return best_recommendation[1]

def _init_argparse():
	parser = argparse.ArgumentParser(description="Returns the id of a "
		"recommended programme for a given user. Returns -1 if no programmes "
		"exist in the database. Exits with status 1 if the user does not exist "
		"in the users table.")
	parser.add_argument('user_id', metavar='uid', type=int,
						help="The ID of a user")
	parser.add_argument('-n', "--name", action="store_true", help="Returns the "
						"name, instead of the id, of the programme.")
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

	recommendation = get_vod_recommendation(args.user_id)

	if args.name:
		recommendation = get_name(recommendation)

	print(str(recommendation), end='')
