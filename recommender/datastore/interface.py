import mysql.connector

from credentials import credentials

def _field_string(fields):
	"""Returns '*' if `fields` is empty, otherwise returns a string of 
	comma-separated elements surrounded by backticks"""
	return ','.join(['`'+f+'`' for f in fields]) or '*'

def get_advert_pool(uid):
	"""Given a user id, returns their advert pool; a set of adverts for which
	the user fulfills all demographics requirements."""
	query = (	"SELECT `campaign`.`id` "
				"FROM `users`,
					`c` AS `campaigns`
					LEFT JOIN (`campaignAgeRanges`, `campaignBoundingBoxes`, "
						"`campaignOccupations`, `campaignProgramme`, "
						"`campaignTimes`) "
					"ON (`campaign`.`id` = `campaignAgeRanges`.`campaign` "
						"AND `campaign`.`id` = `campaignBoundingBoxes`.`campaign` "
						"AND `campaign`.`id` = `campaignOccupations`.`campaign` "
						"AND `campaign`.`id` = `campaignProgrammes`.`campaign`) "
						"AND `campaign`.`id` = `campaignTimes`.`campaign`) "
				"WHERE `users`.`id` = {u} "
				"AND `users`.`dob` - CURDATE() BETWEEN `c`.`min` AND `c`.`max` "
				"AND `users`.`lat` BETWEEN `c`.`north` AND `c`.`south` "
				"AND `users`.`long` BETWEEN `c`.`east` AND `c`.`west` "
				"AND `users`.`occupation` IN `c`.`occupation`").format(u=uid)

def get_programme(pid, fields=[]):
	"""Returns a tuple of the values of the given fields for a programme with 
	the given id. If no fields are specified, all are returned."""
	query = (	'SELECT '+_field_string(fields)+' '
				'FROM `programmes` '
				'WHERE `id`='+str(pid))
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()
	cursor.execute(query)
	results = cursor.fetchall()[0][0]
	cursor.close()
	conn.close()
	return results

def get_user(userid, fields=[]):
	"""Returns a tuple of the values of the given fields for a user with 
	the given id. If no fields are specified, all are returned."""
	query = (	'SELECT '+_field_string(fields)+' '
				'FROM `users` '
				'WHERE `id`='+str(userid))
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()
	cursor.execute(query)
	results = cursor.fetchall()[0][0]
	cursor.close()
	conn.close()
	return results

def set_user(userid, fields=[], vals=[]):
	assert len(fields) == len(vals)

	changes = ', '.join("{}='{}'".format(e[0], e[1]) for e in zip(fields, vals))
	query = "UPDATE `users` SET {c} WHERE `id`={id}".format(c=changes, id=userid)

	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()
	cursor.execute(query)
	conn.commit()
	cursor.close()
	conn.close()
