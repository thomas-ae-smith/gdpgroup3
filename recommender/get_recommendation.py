#!/usr/bin/python2.7

from __future__ import print_function

import argparse
import time

import mysql.connector
import numpy

from datastore.credentials import credentials

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
	vector = cursor.next()[0]

	cursor.close()
	conn.close()

	return vector

def get_upcoming_programmes(lookahead=300):
	query = (	'SELECT `channel`, `vector` '
				'FROM `programmes` '
				'WHERE `start_time` '
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
	channel_vectors = []
	for channel, vector in cursor:
		channel_vectors.append((channel, vector))

	cursor.close()
	conn.close()

	return channel_vectors

def get_recommendation(user_id, lookahead=300):
	"""Given a userid, returns the channel for a programme recommended by 
	the recommender which starts within the next `lookahead` seconds. 
	Retruns -1 if there are no programmes in the database to recommend."""

	user_vector = get_user_vector(user_id)
	upcoming_programmes = get_upcoming_programmes(lookahead)

	user_vector = numpy.array(user_vector.split(", "))

	best_recommendation = (float('inf'), -1)
	for channel, vector in upcoming_programmes:
		diff = user_vector - vector
		# If the norm of the difference vector is the smallest so far...
		if numpy.sqrt(numpy.dot(diff, diff)) < best_recommendation[0]:
			# ...recommend that programme
			best_recommendation = (vector, channel)

	return best_recommendation[1]

# If called from the commandline.
if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Given a user ID, returns a "
		"channel recommended for the user to switch to after their current "
		"programme has finished.")
	parser.add_argument('user_id', metavar='uid', type=str,
						help="The ID of a user")
	parser.add_argument('-t', "--time", help="The greatest length of time, in "
		"seconds, between right now and when the recommendation begins. "
		"Default 300 (5 minutes).")
	args = parser.parse_args()

	lookahead = args.time or 300
	print(str(get_recommendation(args.user_id, lookahead)))
