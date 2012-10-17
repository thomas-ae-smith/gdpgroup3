#!/usr/local/bin/python2.7

from __future__ import print_function

import pdb
import pickle
import time

import mysql.connector
import tvdb_api

_tvdb = tvdb_api.Tvdb(cache="tvdb_cache")

def get_epg(lookahead=3600):
	"""Pulls EPG data from the project4 database for the next `lookahead` 
	seconds, processes it and writes it to the local database"""

	time_now = int(time.time())
	query_inqb8r = ('SELECT `key`, `channelID`, `genre`, `type`, `showName`, '
						'`duration_min`, `start_TimeStamp`, `rating` '
					'FROM project4_epg '
					'WHERE start_TimeStamp BETWEEN {earliestTime} AND {latestTime}'
					).format(
						earliestTime=time_now,
						latestTime=time_now+lookahead)
	query_warlock = ('INSERT INTO your4(id, channel, vector, length, start_time)'
			'VALUES (%s, %s, %s, %s, %s)')

	try:
		conn_inqb8r = mysql.connector.connect(user='teamgdp',
											database='inspirit_inqb8r',
											password='MountainDew2012',
											host='77.244.130.51',
											port=3307)
		cursor_inqb8r = conn_inqb8r.cursor()
		cursor_inqb8r.execute(query_inqb8r)
	except: # If anything goes wrong, close the connection!
		conn_inqb8r.close()
		raise
	conn_inqb8r.close()

	try:
		conn_warlock = mysql.connector.connect(user='your4',
											password='2zVGP58Z5YttvAxV',
											database='your4')
		cursor_warlock = conn_warlock.cursor()
		for (key, chanID, genre, _type, name, duration, startTime, rating) in cursor_inqb8r:
			vector = pickle.dumps(calc_prog_vector(name))
			cursor_warlock.execute(query_warlock, (key, chanID, vector, duration, startTime))
	except:	# If anything goes wrong, close the connection!
		conn_inqb8r.close()
		raise
	conn_inqb8r.close()

_genre_convert = {
	"Action and Adventure":0,
	"Animation":1,
	"Children":2,
	"Comedy":3,
	"Documentary":4,
	"Drama":5,
	"Game Show":6,
	"Home and Garden":7,
	"Mini-Series":8,
	"News":9,
	"Reality":10,
	"Science-Fiction":11,
	"Fantasy":12,
	"Soap":13,
	"Special Interest":14,
	"Sport":15,
	"Talk Show":16,
	"Western":17,
	"Unclassified":18
}

def get_programme_vector(title):
	"""Given a programme name, returns a vector representiong that programme 
	to be used by the recommender"""
	genre_vec = [0] * len(genre_convert)
	try:
		tvdb_genres = _tvdb[title]['genre']

		for genre in filter(None, tvdb_genres.split('|')):
			genre_vec[genre_convert[genre.rstrip()]] = 1
		movies[movieid] = genre_vec
		if not tvdb_genres:
			print("Empty genre list returned by tvdb: "+title)
	except AttributeError:
		print("No 'genre' attribute returned by tvdb: "+title)
		genre_vec[genre_convert['Unclassified']] = 1
	except tvdb_api.tvdb_shownotfound:
		print("Not found by tvdb: "+title)
		genre_vec[genre_convert['Unclassified']] = 1
	except KeyError:
		print("KeyError returned by tvdb: "+title)
		genre_vec[genre_convert['Unclassified']] = 1
	except tvdb_api.tvdb_error:
		print("Error 'tvdb_error', possibly malformed repsonse: "+title)
		genre_vec[genre_convert['Unclassified']] = 1
	except IndexError:
		print("IndexError returned by tvdb. WTF?!?!?!?: "+title)
		genre_vec[genre_convert['Unclassified']] = 1

	return genre_vec

get_epg()
