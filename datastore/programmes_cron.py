#!/usr/local/bin/python2.7

from __future__ import print_function

import pdb
import pickle
import time

import mysql.connector
import numpy
import tvdb_api

SECONDS_LOOKAHEAD = 60 * 60 # 1 hour
THETVDB_API_KEY = '45B44486379A2047'

def calc_prog_vector(genre, type, rating, name, description):
	t = tvdb_api.Tvdb()
	t[name]
	return numpy.array([0,0,0,0,0,0,0,0,0,0])

time_now = int(time.time())
query_inqb8r = ('SELECT `key`, `channelID`, `genre`, `type`, '
					'`duration_min`, `start_TimeStamp`, `rating` '
				'FROM project4_epg '
				'WHERE start_TimeStamp BETWEEN {earliestTime} AND {latestTime}'
				).format(
					earliestTime=time_now,
					latestTime=time_now+SECONDS_LOOKAHEAD)

conn_inqb8r = mysql.connector.connect(user='teamgdp',
									database='inspirit_inqb8r',
									password='MountainDew2012',
									host='77.244.130.51',
									port=3307)
cursor_inqb8r = conn_inqb8r.cursor()
cursor_inqb8r.execute(query)
conn_inqb8r.close()

query_warlock = ('INSERT INTO your4(id, channel, vector, length, start_time)'
		'VALUES (%s, %s, %s, %s, %s)')
conn_warlock = mysql.connector.connect(user='your4',
									password='2zVGP58Z5YttvAxV',
									database='your4')
cursor_warlock = conn_warlock.cursor()
for (key, chanID, genre, type, duration, startTime, rating) in cursor_inqb8r:
	vector = pickle.dumps(calc_prog_vector())
	cursor.execute(query, (key, chanID, vector, duration, startTime))

conn_inqb8r.close()
