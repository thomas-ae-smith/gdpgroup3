#!/usr/bin/python2.7

from __future__ import print_function

import argparse
import sys
import time

import mysql.connector
import numpy

from datastore.credentials import credentials

def convert_vector(vector):
	""" Given a string representing a vector returned from the datastore, 
	returns a numpy array representation of the vector. The precision is capped 
	to 12 s.f for the purpose of restricting each vector element inthe database 
	to 14 characters plus 1 character for the separator."""
	if vector.startswith('['):	# This is here for legacy reasons.
		vector = vector[1:-1].split(", ")

	cat = lambda s: round(float(s.strip()), 12)
	return numpy.array([cat(e) for e in vector.split(",")])

def get_user_vector(user_id):
	query = (	'SELECT `vector` '
				'FROM `users` '
				'WHERE `id` = {id}'.format(
					id=user_id))
	conn = mysql.connector.connect(user=credentials['username'],
								password=credentials['password'],
								database=credentials['db'],
								host=credentials['host'],
								port=credentials['port'])
	cursor = conn.cursor()

	cursor.execute(query)
	try:
		vector = cursor.next()
	except StopIteration:
		print("No user with the id {id}".format(id=user_id), file=sys.stderr)
		exit(1)

	vector = convert_vector(vector[0])

	cursor.close()
	conn.close()

	return vector

def get_upcoming_programmes(lookahead=300):
	query = (	'SELECT `channel`, `vector` '
				'FROM `programmes` '
				'WHERE `start` '
				'BETWEEN {start_time} '
				'AND {end_time}'.format(
					start_time=int(time.time()),
					end_time=int(time.time() + lookahead)))

	conn = mysql.connector.connect(user=credentials['username'],
								password=credentials['password'],
								database=credentials['db'],
								host=credentials['host'],
								port=credentials['port'])
	cursor = conn.cursor()

	cursor.execute(query)

	channel_vectors = []
	for channel, vector in cursor:
		vector = convert_vector(vector)
		channel_vectors.append((channel, vector))

	if not channel_vectors:
		print("No programmes in the database which start within the next {t} "
				"seconds!".format(t=lookahead), file=sys.stderr)

	cursor.close()
	conn.close()

	return channel_vectors

def get_recommendation(user_id, lookahead=300):
	"""Given a userid, returns the channel for a programme recommended by 
	the recommender which starts within the next `lookahead` seconds. 
	Retruns -1 if there are no programmes in the database to recommend."""

	user_vector = get_user_vector(user_id)
	upcoming_programmes = get_upcoming_programmes(lookahead)

	best_recommendation = (float('inf'), -1)
	for channel, vector in upcoming_programmes:
		diff = user_vector - vector
		distance = numpy.sqrt(numpy.dot(diff, diff)
		# If the norm of the difference vector is the smallest so far...
		if distance < best_recommendation[0]:
			# ...recommend that programme
			best_recommendation = (distance, channel)

	return best_recommendation[1]

# If called from the commandline.
if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Given a user ID, returns a "
		"the channel of a programme recommended by the recommender which "
		"starts within the period `TIME` specified (defualt 5 mins). Returns "
		"-1 if there are no programmes in the database which start within "
		"the specified time. Exits with status 1 if the user id given does "
		"not exist in the database of users")
	parser.add_argument('user_id', metavar='uid', type=str,
						help="The ID of a user")
	parser.add_argument('-t', "--time", type=float, help="The greatest length "
		"of time, in seconds, between right now and when the recommendation "
		"begins. Default 300 (5 minutes).")
	args = parser.parse_args()

	lookahead = args.time or 300
	print(str(get_recommendation(args.user_id, lookahead)))
