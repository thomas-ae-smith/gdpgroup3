#!/usr/local/bin/python2.7

from __future__ import print_function

import datetime
import pdb
import time

import mysql.connector

connection = mysql.connector.connect(user='teamgdp',
									database='inspirit_inqb8r',
									password='MountainDew2012',
									host='77.244.130.51',
									port=3307)

time_now = int(time.mktime(datetime.datetime.now().timetuple()))
time_in_5_mins = time_now + (60 * 60)

query = ("SELECT `key`, `channelID`, `genre`, `type`, "
			"`duration_min`, `start_TimeStamp`, `rating` "
		"FROM project4_epg "
		"WHERE start_TimeStamp BETWEEN {earliestTime} AND {latestTime}"
		).format(earliestTime=time_now, latestTime=time_in_5_mins)

cursor = connection.cursor()
cursor.execute(query)

for (key, cID, genre, type, duration, startTime, rating) in cursor:
	print(key, cID, genre, type, duration, startTime, rating)
