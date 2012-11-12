#!/usr/bin/python2.7

from __future__ import division, print_function

import argparse
import datetime
from dateutil.relativedelta import relativedelta
import json

import mysql.connector

from datastore.credentials import credentials

DEBUG = False
VERBOSE = False

def get_user_nicheness(ageranges=(), boundingboxes=(), genders=(), occupations=()):
	now = datetime.datetime.now().date()

	age_constraints = ") OR (".join([
		" AND ".join(filter(None, [
			"`user`.`dob` >= '{lower}'" if maxage else None,
			"`user`.`dob` <= '{upper}'" if minage else None
		])).format(upper=now - relativedelta(years=minage or 0),
					lower=now - relativedelta(years=maxage or 0))
	for minage, maxage in ageranges])

	age_constraints = "(" + age_constraints + ")" if age_constraints else None

	bb_constraints = (") OR (".join([
		" AND ".join(filter(None, [
			"`user`.`long` >= '{longmin}'" if longmin else None,
			"`user`.`long` <= '{longmax}'" if longmax else None,
			"`user`.`lat` >= '{latmin}'" if latmin else None,
			"`user`.`lat` <= '{latmax}'" if latmax else None
		])).format(longmin=longmin, longmax=longmax,
						latmin=latmin, latmax=latmax)
	for latmin, latmax, longmin, longmax in boundingboxes]))
	bb_constraints = "(" + bb_constraints + ")" if bb_constraints else None

	if genders:
		gender_constraints = ("`user`.`gender` "
			"IN ('{genders}')".format(genders=",".join(genders)))
	else:
		gender_constraints = ""

	if occupations:
		occupation_constraints = ("`user`.`occupation` "
			"IN ('{occupations}')".format(occupations="','".join(occupations)))
	else:
		occupation_constraints = ""

	constraints = [age_constraints, bb_constraints, gender_constraints, 
		occupation_constraints]
	query = ("SELECT COUNT(`id`) FROM `user` WHERE ({})".format(
			") AND (".join(filter(None, constraints)) or "1"))

	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	if VERBOSE:
		print("User nicheness query: {q}".format(q=query))

	cursor.execute(query)
	users_constrained = cursor.next()[0]

	cursor.execute("SELECT COUNT(`id`) FROM `user` WHERE 1")
	users_all = cursor.next()[0]

	return users_constrained / users_all

def get_programme_nicheness(genres=(), programmes=()):
	if genres:
		genre_list = "'{}'".format("','".join(genres))
		genre_constraints = "`g_p`.`genre_id` IN ({})".format(genre_list)
	else:
		genre_constraints = ""

	if programmes:
		programmes_list = "'{}'".format("','".join(programmes))
		programme_constraints = "`p`.`id` IN ({})".format(programmes_list)
	else:
		programme_constraints = ""

	constraints = [genre_constraints, programme_constraints]
	query = (	"SELECT COUNT(`p`.`id`) "
				"FROM `programme` as `p` "
				"LEFT JOIN `genre_programme` as g_p "
					"ON `p`.`id` = `g_p`.`programme_id` "
				"WHERE "
				"{}").format(" AND ".join(filter(None, constraints)) or "1")
		
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	if VERBOSE:
		print("Programme nicheness query: {q}".format(q=query))

	try:
		# Get the number of programmes covered by constraints
		cursor.execute(query)
		programmes_constrained = cursor.next()[0]

		# Get the total number of programmes
		cursor.execute("SELECT COUNT(`id`) FROM `programme` WHERE 1")
		programmes_all = cursor.next()[0]
	finally:
		cursor.close()
		conn.close()

	# Return the percentage of programmes covered by constraints.
	return programmes_constrained / programmes_all

def get_time_nicheness(times):
	overlapping_blocks = []
	for start, end, day in times:
		if start in {None, ''}:
			start = 0
		else:
			hrs, mins, secs = [int(v) for v in start.split(':')]
			start = secs + (60*mins) + (3600*secs)

		if end in {None, ''}:
			end = 60 * 60 * 24
		else:
			hrs, mins, secs = [int(v) for v in end.split(':')]
			end = secs + (60*mins) + (3600*secs)

		if end <= start:
			continue

		if day is not None:
			day = day % 7
			start += day * 60 * 60 * 24
			end += day * 60 * 60 * 24
			overlapping_blocks.append([start, end])
		else:
			for day in xrange(7):
				addsecs = day * 60 * 60 * 24
				overlapping_blocks.append([start+addsecs, end+addsecs])

	nonoverlapping_blocks = []
	for block_a in overlapping_blocks:
		for block_b in overlapping_blocks:
			nonoverlapping_block = block_a
			if block_a[0] <= block_b[0] <= block_a[1]:
				nonoverlapping_block[1] = max(block_a[1], block_b[1])
			if block_a[0] <= block_b[1] <= block_a[1]:
				nonoverlapping_block[0] = min(block_a[0], block_b[0])
			nonoverlapping_blocks.append(nonoverlapping_block)

	restricted_time = sum(block[1] - block[0] for block in nonoverlapping_blocks)
	return restricted_time / (60*60*24*7)

def get_nicheness(ageranges=(), boundingboxes=(), genders=(), genres=(),
					occupations=(), programmes=(), times=()):
	user_nicheness = get_user_nicheness(ageranges, boundingboxes,
											genders, occupations)

	programme_nicheness = get_programme_nicheness(genres, programmes)

	time_nicheness = get_time_nicheness(times)

	if VERBOSE:
		print("User nicheness:\t{u}".format(u=user_nicheness))
		print("Programme nicheness:\t{p}".format(p=programme_nicheness))

	return 1 - ((1-user_nicheness)*(1-programme_nicheness)*(1-time_nicheness))

def _init_argparse():
	def int_or_null(_int):
		if _int == "":
			return None
		else:
			return int(_int)

	parser = argparse.ArgumentParser(description="Given a set of restrictions "
		"in json, returns the nicheness of a campaign with those restrictions. "
		"Store this value in the 'nicheness' attribute of each campaign. "
		"Restrictions can be specified either individual lists with flags, or "
		"through a JSON string.")

	"""
	json_or_flags = parser.add_mutually_exclusive_group()
	flags_group = json_or_flags.add_argument_group()
	flags_group.add_argument('-a', '--age_ranges', nargs='*', type=int_or_null,
		help="A list of age ranges, which is split into pairs of (minage, "
		"maxage). Bounds are inclusive. Must be of even length. -1 is taken to "
		"mean unbounded. Example: '-1 10 20 25 60 -1' is split into "
		"(unbounded-10), (20-25), (60-unbounded).")
	flags_group.add_argument('-b', '--bounding_boxes', nargs='*', type=int_or_null,
		help="A list of bounding boxes, given by a list of sequences of four "
		"numbers representing the bounds on a bounding box, of format: "
		"(latmin, latmax, longmin, longmax). Must be a multiple of 4. If a "
		"sequence of 4n numbers is given, this will be used as n bounding "
		"boxes.")
	flags_group.add_argument('-g', '--genders', nargs='*', type=str,
		choices=['m', 'f', 'male', 'female'], help="A list of genders.")
	flags_group.add_argument('-G', '--genres', nargs='*', type=int,
		help="A list of genre ids from the genres table in the database.")
	flags_group.add_argument('-o', '--occupations', nargs='*', type=int,
		help="A list of occupation ids from the occupations table.")
	flags_group.add_argument('-p', '--programmes', nargs='*', type=int,
		help="A list of programme ids from the programmes table.")
	flags_group.add_argument('-t', '--times', nargs='*', type=str,
		help="A list of time/day restrictions. Each restriction is a triple, "
		"of the form (startTime, endTime, day), where the times are strings "
		"between 00:00:00-23:59:59. day is an int 0-6 representing a weekday. "
		"The list must have 3n elements representing n restrictions.")
	if args.times:
		args.times = map(lambda s: None if s=="" else s, args.times)
	"""

	parser.add_argument('json', type=str,
						help="An input string in json format. Required format: "
						"{\n"
						"\t'ageranges':[(minage, maxage)],\n"
						"\t'boundingboxes':[(latmin, latmax, longmin, longmax)],\n"
						"\t'genders':[genders],\n"
						"\t'genres':[genre_ids],\n"
						"\t'occupations':[occupation_ids],\n"
						"\t'programmes':[programme_ids],\n"
						"\t'times':[(start_time, end_time, weekday)]\n"
						"}")
	parser.add_argument('-T', "--test", action='store_true',
						help="Runs using an example set of constraints for "
						"testing purposes, overriding any other input.")
	parser.add_argument('-v', "--verbose", action='store_true',
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")

	return parser.parse_args()

def tupleify(_list,tupleSize):
	if _list is not None:
		assert len(_list) % tupleSize == 0

		tupleList = []
		for n in xrange(int(len(_list) / tupleSize)):
			_tuple = tuple(_list[n+pos] for pos in xrange(tupleSize))
			_tuple = map(lambda s: None if s=='' else s, _tuple)
			tupleList += [_tuple]

		return tupleList
	else:
		return []

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	if args.debug:
		DEBUG = True
	if args.verbose:
		VERBOSE = True

	if args.test:
		input_dict = {
			'ageranges':[(None, 20), (50, None)],
			'boundingboxes':[(None,51.686,-0.489,0.236)],
			'genders':['male'],
			'genres':['0', '1', '4', '8', '12'],
			'occupations':['0', '6', '8', '1', '9', '4'],
			'programmes':['1', '2', '3', '4', '5', '6'],
			'times':[(None, None, 0), ("10:00:00", "22:00:00", None)],
		}
	else:
		input_dict = json.loads(args.json)

	print(get_nicheness(**input_dict), end='')
