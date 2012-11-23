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
Programme = collections.namedtuple('Programme', ['id', 'genres', 'schedule'])
User = collections.namedtuple('User', ['id', 'age', 'gender', 'occupation',
										'lat', 'long'])

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

def get_advert_pool(uid, pid, when=None, maxlen=None, exclude=(), live=True):
	"""Given a user id, programme id and time, returns a pool of adverts whose
	campaigns allow the advert to be shown to the given user during the given
	programme at the given time. Advert ids are returned along with the
	campaign nichenesses."""
	if when is None:
		when = datetime.datetime.now()

	# Get user details
	user_query = (	"SELECT `id`, `dob`, `gender`, `occupation_id`, `lat`, "
						"`long` "
					"FROM `user` "
					"WHERE `id` = {uid}").format(uid=uid)
	user_response = read_db(user_query)[0]
	user = User(user_response[0],			# id
				calc_age(user_response[1]),	# age
				user_response[2], 			# gender
				user_response[3], 			# occupation
				user_response[4], 			# lat
				user_response[5]) 			# long

	###### Restrict campaigns to user restrictions ######

	# Get campaigns where the user fits age requirements
	agequery = ("SELECT `campaign`.`id`,`campaign`.`nicheness` "
				"FROM `campaign` "
				"LEFT JOIN `agerange` "
				"ON `campaign`.`id` = `agerange`.`campaign_id` "
				"WHERE (`agerange`.`minage` IS NULL "
					"OR `agerange`.`minage` <= {age}) "
				"AND (`agerange`.`maxage` IS NULL "
					"OR `agerange`.`maxage` >= {age})").format(
						age=user.age)
	# Keep track of valid campaigns to show
	valid_campaigns = set(read_db(agequery))
	if not valid_campaigns: # If no valid campaigns, may as well stop querying.
		return {}

	# Restrict to campaigns where user fits gender requirements.
	genderquery = ("SELECT `campaign`.`id`,`campaign`.`nicheness` "
					"FROM `campaign` "
					"WHERE (FIND_IN_SET('{gender}',`gender`) > 0) "
					"OR (`gender` = '') "
					"OR (`gender` IS NULL)").format(gender=user.gender)
	valid_campaigns.intersection_update(set(read_db(genderquery)))
	if not valid_campaigns:
		return {}

	# Get campaigns where the user fits occupation requirements
	occupationquery = (	"SELECT `campaign`.`id`,`campaign`.`nicheness` "
						"FROM `campaign` "
						"LEFT JOIN `campaign_occupation` "
						"ON `campaign`.`id` = `campaign_occupation`.`campaign_id` "
						"WHERE `campaign_occupation`.`occupation_id` IS NULL "
						"OR `campaign_occupation`.`occupation_id` = "
							"{occupation}").format(occupation=user.occupation)
	valid_campaigns.intersection_update(set(read_db(occupationquery)))
	if not valid_campaigns:
		return {}

	# Get campaigns where the user fits boundingbox requirements
	bbquery = (	"SELECT `campaign`.`id`,`campaign`.`nicheness` "
				"FROM `campaign` "
				"LEFT JOIN `boundingbox` "
				"ON `campaign`.`id` = `boundingbox`.`campaign_id` "
				"WHERE (`boundingbox`.`minLat` IS NULL "
					"OR `boundingbox`.`minLat` <= {lat}) "
				"AND (`boundingbox`.`maxLat` IS NULL "
					"OR `boundingbox`.`maxLat` >= {lat}) "
				"AND (`boundingbox`.`minLong` IS NULL "
					"OR `boundingbox`.`minLong` <= {long}) "
				"AND (`boundingbox`.`maxLong` IS NULL "
					"OR `boundingbox`.`maxLong` >= {long})").format(
						lat=user.lat, long=user.long)
	valid_campaigns.intersection_update(set(read_db(bbquery)))
	if not valid_campaigns:
		return {}

	###### Restrict campaigns to time restrictions ######
	dt = datetime.datetime.utcfromtimestamp(when)
	timequery = (	"SELECT `campaign`.`id`,`campaign`.`nicheness` "
					"FROM `campaign` "
					"LEFT JOIN `time` "
					"ON `campaign`.`id` = `time`.`campaign_id` "
					"WHERE (`time`.`startTime` IS NULL "
						"OR `time`.`startTime` <= {time}) "
					"AND (`time`.`endTime` IS NULL "
						"OR `time`.`endTime` >= {time}) "
					"AND (`time`.`dayOfWeek` IS NULL "
						"OR `time`.`dayOfWeek` = {day})").format(
							time=dt.time().isoformat(),
							day=dt.isoweekday())
	valid_campaigns.intersection_update(set(read_db(bbquery)))
	if not valid_campaigns:
		return {}

	###### Restrict campaigns to programme restrictions ######
	# Get programme details
	programme_query = (	"SELECT `p`.`id`, `gp`.`genre_id` "
						"FROM `programme` as p "
						"LEFT JOIN `genre_programme` as gp "
						"ON `p`.`id` = `gp`.`programme_id` "
						"WHERE `p`.`id` = {pid}").format(pid=pid)
	programme_response = dict(read_db(programme_query))
	programme = Programme(programme_response.keys()[0],
							set(programme_response.values()),
							{True:'live',False:'vod'}[live])

	if programme.genres:
		genrequery = (	"SELECT `campaign`.`id`,`campaign`.`nicheness` "
						"FROM `campaign` "
						"LEFT JOIN `campaign_genre` "
						"ON `campaign`.`id` = `campaign_genre`.`campaign_id` "
						"WHERE (`campaign_genre`.`genre_id` IS NULL "
							"OR `campaign_genre`.`genre_id` = '' "
							"OR `campaign_genre`.`genre_id` IN ({genres}))").format(
								genres=','.join(str(g) for g in programme.genres))
	else:
		genrequery = (	"SELECT `campaign`.`id`,`campaign`.`nicheness` "
						"FROM `campaign` "
						"LEFT JOIN `campaign_genre` "
						"ON `campaign`.`id` = `campaign_genre`.`campaign_id` "
						"WHERE (`campaign_genre`.`genre_id` IS NULL "
							"OR `campaign_genre`.`genre_id` = ''").format(
								genres=','.join(str(g) for g in programme.genres))

	valid_campaigns.intersection_update(set(read_db(genrequery)))
	if not valid_campaigns:
		return {}

	schedulequery = (	"SELECT `campaign`.`id`,`campaign`.`nicheness` "
						"FROM `campaign` "
						"WHERE (`campaign`.`schedule` IS NULL "
							"OR `campaign`.`schedule` = '' "
							"OR FIND_IN_SET('{schedule}', `campaign`.`schedule`) > 0)").format(
								schedule=programme.schedule)
	valid_campaigns.intersection_update(set(read_db(schedulequery)))
	if not valid_campaigns:
		return {}

	###### Return adverts and their nichenesses ######
	advertquery = ("SELECT `advert_campaign`.`campaign_id`, `advert`.`id` "
					"FROM `advert` "
					"INNER JOIN `advert_campaign` "
					"ON `advert`.`id` = `advert_campaign`.`advert_id` "
					"WHERE `advert_campaign`.`campaign_id` IN ({campaigns}) "
					"AND `advert`.`id` NOT IN ("
						"SELECT `advert_id` "
						"FROM `blacklist_advert` "
						"WHERE `user_id` = {uid}) "
					).format(
						campaigns=",".join(str(a) for a, n in valid_campaigns),
						uid=uid)

	if exclude:
		advertquery += "AND `advert`.`id` NOT IN ({exclude})".format(
							exclude=",".join(str(e) for e in exclude))

	valid_campaigns = dict(valid_campaigns)
	campaigns = {}
	for campaign, advert in read_db(advertquery):
		try:
			campaigns[campaign].adverts.append(advert)
		except KeyError:
			campaigns[campaign] = Campaign(valid_campaigns[campaign], [advert])

	if not campaigns:
		return {}

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
