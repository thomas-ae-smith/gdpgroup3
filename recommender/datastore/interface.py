import argparse
import datetime
from time import time
import random

import mysql.connector

from credentials import credentials
from util.calc_age import calc_age

def _field_string(fields):
	"""Returns '*' if `fields` is empty, otherwise returns a string of
	comma-separated elements surrounded by backticks"""
	return ','.join(['`'+f+'`' for f in fields]) or '*'

def _time_from_seconds(total_seconds):
	hours = total_seconds // 3600
	minutes = (total_seconds % 3600) // 60
	seconds = (total_seconds % 3600) % 60

	time_ = datetime.time(hours, minutes, seconds)
	return time_

def read_db(query):
	try:
		conn = mysql.connector.connect(**credentials)
		cursor = conn.cursor()

		cursor.execute(query)
		result = cursor.fetchall()
	except:
		raise Exception("Error executing mysql query: {q}".format(q=query))
	finally:
		cursor.close()
		conn.close()

	return result
	
def write_db(query):
	try:
		conn = mysql.connector.connect(**credentials)
		cursor = conn.cursor()

		cursor.execute(query)
		conn.commit()
	except:
		raise Exception("Error executing mysql query: {q}".format(q=query))
	finally:
		cursor.close()
		conn.close()

def add_advert_blacklist(userId, advertId):
	query = (	"INSERT INTO `blacklistAdvert` "
					"(`user`, `advert`) "
				"VALUES "
					"('{uid}', '{aid}')".format(
						uid=userId, aid=advertId))

	response = write_db(query)

def add_programme_blacklist(userId, programmeId):
	query = (	"INSERT INTO `blacklistProgramme` "
					"(`user`, `programme`) "
				"VALUES "
					"('{uid}', '{pid}')".format(
						uid=userId, pid=programmeId))

	response = write_db(query)

# TODO: Only return from current campaigns.
def get_campaign_pool(uid, pid, when=None):
	"""Given a user id, programme id and time, returns a pool of adverts whose
	campaigns allow the advert to be shown to the given user during the given
	programme at the given time. Advert ids are returned along with the
	campaign nichenesses."""
	if when is None:
		when = datetime.datetime.now()

	query = (
		"SELECT `u`.`dob`, `u`.`gender`, `u`.`occupation`, `u`.`lat`, "
			"`u`.`long`, `p`.`id`, `p`.`channel`, `p`.`genre`, `p`.`live`, "
			"`c`.`schedule`, `c`.`gender`, `c_a`.`minAge`, `c_a`.`maxAge`, "
			"`c_b`.`minLong`, `c_b`.`maxLong`, `c_b`.`minLat`, `c_b`.`maxLat`, "
			"`c_g`.`genres_id`, `c_o`.`occupations_id`, `c_p`.`programmes_id`, "
			"`c_t`.`dayOfWeek`, `c_t`.`startTime`, `c_t`.`endTime`, "
			"`c`.`id`, `c`.`nicheness`"
		"FROM `users` AS u, `programmes` as p, `campaigns` as c "
		"LEFT JOIN `agerange`     AS c_a ON `c`.`id`=`c_a`.`campaigns_id` "
		"LEFT JOIN `boundingbox` AS c_b ON `c`.`id`=`c_b`.`campaigns_id` "
		"LEFT JOIN `campaigns_genres`        AS c_g ON `c`.`id`=`c_g`.`campaigns_id` "
		"LEFT JOIN `campaigns_occupations`   AS c_o ON `c`.`id`=`c_o`.`campaigns_id` "
		"LEFT JOIN `campaigns_programmes`    AS c_p ON `c`.`id`=`c_p`.`campaigns_id` "
		"LEFT JOIN `time`         AS c_t ON `c`.`id`=`c_t`.`campaigns_id` "
		"WHERE `u`.`id` = {id} "
		"AND `c`.`startDate` <= {when} "
		"AND {when} <= `c`.`endDate`").format(id=uid, when=when)
		# "AND `c_t`.`startTime` <= {when} "
		# "AND {when} <= `c_t`.`endTime` "

	response = read_db(query)

	adverts = {}
	for fields in response:
		user = {}
		programme = {}
		restrict = {}
		(user['dob'], user['gender'], user['occupation'], user['lat'],
			user['long'], programme['id'], programme['channel'],
			programme['genre'], programme['live'], restrict['schedule'],
			restrict['gender'], restrict['minAge'], restrict['maxAge'],
			restrict['minLong'], restrict['maxLong'], restrict['minLat'],
			restrict['maxLat'], restrict['genre'], restrict['occupation'],
			restrict['programme'], restrict['dayOfWeek'], restrict['startTime'],
			restrict['endTime'], campaignid, nicheness) = response

		dt = datetime.datetime.utcfromtimestamp(when)
		restriction_match = {
			'schedule': lambda: programme['live'] in restrict['schedule'],
			'gender': lambda: user['gender'] in restrict['gender'],
			'minAge': lambda: calc_age(user['dob']) >= restrict['minAge'],
			'maxAge': lambda: calc_age(user['dob']) <= restrict['maxAge'],
			'minLong': lambda: user['long'] >= float(restrict['minLong']),
			'maxLong': lambda: user['long'] <= float(restrict['maxLong']),
			'minLat': lambda: user['lat'] >= float(restrict['minLat']),
			'maxLat': lambda: user['lat'] <= float(restrict['maxLat']),
			'genre': lambda: programme['genre'] == restrict['genre'],
			'occupation': lambda: user['occupation'] == restrict['occupation'],
			'programme': lambda: programme['id'] == restrict['programme'],
			'dayOfWeek': lambda: dt.isoweekday() == restrict['dayOfWeek'],
			'startTime': lambda: dt.time() >= _time_from_seconds(
												restrict['startTime'].seconds),
			'endTime': lambda: dt.time() <= _time_from_seconds(
													restrict['endTime'].seconds)
		}

		available = all([v is None or restriction_match[k]()
							for k, v in restrict.iteritems()])

		if available:
			adverts[campaignid] = float(nicheness)

	return adverts

def get_ad(campaignId):
	query = (	"SELECT `id` "
				"FROM `adverts_campaigns` "
				"WHERE `campaign` = {campaignId}".format(
					campaignId=campaignId))
				
	response = read_db(query)

	# 'or [-1]' sets 'campaigns' to [-1] if no campaigns are returned.
	campaigns = [fields[0] for fields in response] or [-1]

	return random.choice(campaigns)


def get_upcoming_programmes(startTime=time(), lookahead=300):
	query = (	"SELECT `id`, `vector` "
				"FROM `programmes` "
				"WHERE `programmes`.`name` != 'Off air' "
				"AND `start` "
				"BETWEEN {start_time} "
				"AND {end_time}".format(
					start_time=int(startTime),
					end_time=int(startTime + lookahead)))

	response = read_db(query)

	channel_vectors = [(p_id, p_vector) for p_id, p_vector in response]

	return channel_vectors


def get_programme(pid, fields=()):
	"""Returns a tuple of the values of the given fields for a programme with
	the given id. If no fields are specified, all are returned."""
	query = (	'SELECT '+_field_string(fields)+' '
				'FROM `programmes` '
				'WHERE `id`='+str(pid))

	response = read_db(query)

	return response[0]

def get_user(userid, fields=()):
	"""Returns a tuple of the values of the given fields for a user with
	the given id. If no fields are specified, all are returned."""

	query = (	'SELECT '+_field_string(fields)+' '
				'FROM `users` '
				'WHERE `id`='+str(userid))
	response = read_db(query)
	return response[0]

def set_user(userid, fields=(), vals=()):
	assert len(fields) == len(vals)

	changes = ', '.join("{}='{}'".format(e[0], e[1]) for e in zip(fields, vals))
	query = "UPDATE `users` SET {c} WHERE `id`={id}".format(c=changes, id=userid)

	write_db(query)
