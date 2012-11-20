from __future__ import division, print_function

import argparse
import collections
import datetime
from time import time
import random
import sys

import mysql.connector

from credentials import credentials
from util.calc_age import calc_age

Campaign = collections.namedtuple('Campaign', ['nicheness','adverts'])

def _field_string(fields):
	"""Returns '*' if `fields` is empty, otherwise returns a string of
	comma-separated elements surrounded by backticks"""
	return ','.join(['`'+f+'`' for f in fields]) or '*'

def _time_from_str(timestr):
	hours, minutes, seconds = [int(t) for t in timestr.split(":")]
	assert 0 <= hours <= 24
	assert 0 <= minutes <= 60
	assert 0 <= seconds <= 60
	return datetime.time(hours, minutes, seconds)

def read_db(query):
	try:
		conn = mysql.connector.connect(**credentials)
	except:
		raise Exception("Error connecting to database!")
	else:
		try:
			cursor = conn.cursor()
		except:
			raise Exception("Error executing mysql query: {q}!".format(q=query))
		else:
			try:
				cursor.execute(query)
				result = cursor.fetchall()
			finally:
				cursor.close()
		finally:
			conn.close()

	return result
	
def write_db(query):
	try:
		conn = mysql.connector.connect(**credentials)
	except:
		raise Exception("Error connecting to database!")
	else:
		try:
			cursor = conn.cursor()
		except:
			raise Exception("Error executing mysql query: {q}!".format(q=query))
		else:
			try:
				cursor.execute(query)
				conn.commit()
			finally:
				cursor.close()
		finally:
			conn.close()

def add_advert_blacklist(userId, advertId):
	query = (	"INSERT INTO `blacklist_advert` (`user_id`, `advert_id`) "
				"VALUES ('{uid}', '{aid}')".format(uid=userId, aid=advertId))

	response = write_db(query)

def add_programme_blacklist(userId, programmeId):
	query = (	"INSERT INTO `blacklist_programme` (`user_id`, `programme_id`) "
				"VALUES ('{uid}', '{pid}')".format(uid=userId, pid=programmeId))

	response = write_db(query)

def get_advert_pool(uid, pid, when=None, maxlen=None, exclude=()):
	"""Given a user id, programme id and time, returns a pool of adverts whose
	campaigns allow the advert to be shown to the given user during the given
	programme at the given time. Advert ids are returned along with the
	campaign nichenesses."""
	if when is None:
		when = datetime.datetime.now()

	user_fields = ['dob', 'gender', 'occupation_id', 'lat', 'long']
	user = {user_fields[index]:val for index, val in
							enumerate(get_user(uid, user_fields))}

	broadcast_fields = ['pid', 'live']
	broadcast_query = ( "SELECT `programme`.`id`, "
							"if(`broadcast`.`time`>{time}, 'live', 'vod') "
						"FROM `broadcast` "
						"LEFT JOIN `programme`"
							"ON (`programme`.`id`=`broadcast`.`programme_id`) "
						"WHERE `broadcast`.`programme_id` = {pid}"
						).format(time=when, pid=pid)

	try: 
		broadcast = {broadcast_fields[index]:val for index, val in
								enumerate(read_db(broadcast_query)[0])}
	except IndexError: # If the programme does not exist in the db
		if pid != 0:
			print("There is no programme with id {pid}!".format(pid=pid),
			file=sys.stderr)
		pid = None # This is set to help debugging (all references to a programme 
					# crash), and to indicate the programme is nonexistant.
	else:
		genres_query = ("SELECT `genre_id` FROM `genre_programme` WHERE "
						"`programme_id` = {pid}").format(pid=pid)
		genres = [field[0] for field in read_db(genres_query)]

	blacklist_query = (	"SELECT `advert_id` "
						"FROM `blacklist_advert` "
						"WHERE `user_id` = {uid}".format(uid=uid))
	blacklisted_adverts = [str(row[0]) for row in read_db(blacklist_query)]

	campaign_query = (
		"SELECT `c`.`schedule`, `c`.`gender`, `c_a`.`minAge`, `c_a`.`maxAge`, "
			"`c_b`.`minLong`, `c_b`.`maxLong`, `c_b`.`minLat`, `c_b`.`maxLat`, "
			"`c_g`.`genre_id`, `c_o`.`occupation_id`, `c_p`.`programme_id`, "
			"`c_t`.`dayOfWeek`, `c_t`.`startTime`, `c_t`.`endTime`, "
			"`a_c`.`advert_id`, `c`.`id`, `c`.`nicheness`"
		"FROM `campaign` as c "
		"LEFT JOIN `time`             AS c_t ON `c`.`id`=`c_t`.`campaign_id` "
		"LEFT JOIN `agerange`         AS c_a ON `c`.`id`=`c_a`.`campaign_id` "
		"LEFT JOIN `boundingbox`      AS c_b ON `c`.`id`=`c_b`.`campaign_id` "
		"LEFT JOIN `campaign_genre`  AS c_g ON `c`.`id`=`c_g`.`campaign_id` "
		"LEFT JOIN `advert_campaign` AS a_c ON `c`.`id`=`a_c`.`campaign_id` "
		"LEFT JOIN `advert`          AS a   ON `a`.`id`=`a_c`.`advert_id` "
		"LEFT JOIN `campaign_programme`  AS c_p "
			"ON `c`.`id`=`c_p`.`campaign_id` "
		"LEFT JOIN `campaign_occupation` AS c_o "
			"ON `c`.`id`=`c_o`.`campaign_id` "
		"WHERE {when} BETWEEN `c`.`startDate` AND `c`.`endDate`"
	).format(when=when)

	if blacklisted_adverts:
		campaign_query += " AND `a_c`.`advert_id` NOT IN {blacklist}".format(
			blacklist="('{ads}')".format(ads="','".join(blacklisted_adverts)))

	if exclude:
		campaign_query += " AND `a_c`.`advert_id` NOT IN ({exclude})".format(
			exclude=','.join(str(p) for p in exclude))

	if maxlen != float('inf'):
		campaign_query += " AND `a`.`duration` <= {maxlen}".format(
							maxlen=maxlen)

	restrictions = read_db(campaign_query)
	restriction_fields = ['schedule', 'gender', 'minAge', 'maxAge', 'minLong',
						'maxLong', 'minLat', 'maxLat', 'genre', 'occupation_id',
						'programme', 'dayOfWeek', 'startTime', 'endTime']
	campaigns = {}
	for fields in restrictions:
		restrict = dict(zip(restriction_fields, fields[:-3]))
		advertid, campaignid, nicheness = fields[-3:]
		dt = datetime.datetime.utcfromtimestamp(when)
		restrict_match = {
			'schedule': lambda: pid and broadcast['live'] in restrict['schedule'],
			'gender': lambda: user['gender'] in restrict['gender'],
			'minAge': lambda: calc_age(user['dob']) >= restrict['minAge'],
			'maxAge': lambda: calc_age(user['dob']) <= restrict['maxAge'],
			'minLong': lambda: user['long'] >= float(restrict['minLong']),
			'maxLong': lambda: user['long'] <= float(restrict['maxLong']),
			'minLat': lambda: user['lat'] >= float(restrict['minLat']),
			'maxLat': lambda: user['lat'] <= float(restrict['maxLat']),
			'genre': lambda: pid and restrict['genre'] in genres,
			'occupation_id': lambda: user['occupation_id'] == restrict['occupation_id'],
			'programme': lambda: pid and broadcast['pid'] == restrict['programme'],
			'dayOfWeek': lambda: dt.isoweekday() == restrict['dayOfWeek'],
			'startTime': lambda: dt.time() >= _time_from_str(
												restrict['startTime']),
			'endTime': lambda: dt.time() <= _time_from_str(
												restrict['endTime'])
		}

		if restrict['gender'] == set(['']):
			restrict['gender'] = None

		if restrict['schedule'] == set(['']):
			restrict['schedule'] = None

		#if not nicheness:
			#import pdb; pdb.set_trace()

		available = all([v is None or restrict_match[k]()
							for k, v in restrict.iteritems()])

		if available:
			try:
				campaigns[campaignid].adverts.append(advertid)
			except KeyError:
				campaigns[campaignid] = Campaign(nicheness=float(nicheness),
												adverts=[int(advertid)])

	return campaigns

def get_ad(campaignId):
	query = (	"SELECT `advert_id` "
				"FROM `advert_campaign` "
				"WHERE `campaign_id` = {campaignId}".format(
					campaignId=campaignId))
				
	response = read_db(query)

	# 'or [-1]' sets 'campaigns' to [-1] if no campaigns are returned.
	campaigns = [fields[0] for fields in response] or [-1]

	return random.choice(campaigns)


def get_broadcast_pool(userId, startTime=time(), lookahead=300, exclude=()):
	query = (	"SELECT `broadcast`.`id`, `brand`.`vector` "
				"FROM `broadcast` "
				"INNER JOIN `programme` ON "
					"(`programme`.`id` = `broadcast`.`programme_id`) "
				"INNER JOIN `brand` ON "
					"(`brand`.`id` = `programme`.`brand_id`) "	
				"WHERE `broadcast`.`time` BETWEEN {start_time} AND {end_time} "
				"AND `programme`.`id` NOT IN ("
					"SELECT `programme_id` "
					"FROM `blacklist_programme` "
					"WHERE `blacklist_programme`.`user_id` = {uid}"
				")".format(uid=userId,
						start_time=int(startTime),
						end_time=int(startTime + lookahead)))

	if exclude:
		query += " AND `programme`.`id` NOT IN ({exclude})".format(
			exclude=','.join(str(p) for p in exclude))

	response = read_db(query)

	channel_vectors = [(p_id, p_vector) for p_id, p_vector in response]

	return channel_vectors


def get_programme_vector(pid):
	query = (	"SELECT `brand`.`vector` "
				"FROM `brand` "
				"LEFT JOIN `programme` "
				"ON `brand`.`id` = `programme`.`brand_id` "
				"WHERE `programme`.`id`= "+str(pid))

	response = read_db(query)

	return response[0][0]

def get_user(userid, fields=()):
	"""Returns a tuple of the values of the given fields for a user with
	the given id. If no fields are specified, all are returned."""

	query = (	'SELECT '+_field_string(fields)+' '
				'FROM `user` '
				'WHERE `id`='+str(userid))
	response = read_db(query) or [None]
	return response[0]

def set_user(userid, fields=(), vals=()):
	assert len(fields) == len(vals)

	changes = ', '.join("{}='{}'".format(e[0], e[1]) for e in zip(fields, vals))
	query = "UPDATE `user` SET {c} WHERE `id`={id}".format(c=changes, id=userid)

	write_db(query)
