#!/usr/bin/python2.7

# TODO: In calculating programme nicheness, use percentage of programme showing 
# time, not percentage of shows covered.

from __future__ import division, print_function

import argparse
import datetime
from dateutil.relativedelta import relativedelta
import json

import mysql.connector

from datastore.credentials import credentials

DEBUG = False
VERBOSE = False

def get_user_nicheness(ageranges=[], boundingboxes=[], genders=[], occupations=[]):
	now = datetime.datetime.now().date()

	age_constraints = (") OR (".join([
		" AND ".join(filter(None, [
			"`users`.`dob` >= '{lower}'" if maxage else None,
			"`users`.`dob` <= '{upper}'" if minage else None
		])).format(upper=now-relativedelta(years=minage or 0),
					lower=now-relativedelta(years=maxage or 0))
	for minage, maxage in ageranges]))
	age_constraints = "(" + age_constraints + ")" if age_constraints else None

	bb_constraints = (") OR (".join([
		" AND ".join(filter(None, [
			"`users`.`long` >= '{longmin}'" if longmin else None,
			"`users`.`long` <= '{longmax}'" if longmax else None,
			"`users`.`lat` >= '{latmin}'" if latmin else None,
			"`users`.`lat` <= '{latmax}'" if latmax else None
		])).format(longmin=longmin, longmax=longmax,
						latmin=latmin, latmax=latmax)
	for latmin, latmax, longmin, longmax in boundingboxes]))
	bb_constraints = "(" + bb_constraints + ")" if bb_constraints else None

	if genders:
		gender_constraints = ("`users`.`gender` "
			"IN ('{genders}')".format(genders=",".join(genders)))
	else:
		gender_constraints = ""

	if occupations:
		occupation_constraints = ("`users`.`occupation` "
			"IN ('{occupations}')".format(occupations="','".join(occupations)))
	else:
		occupation_constraints = ""

	constraints = [age_constraints, bb_constraints, gender_constraints, 
		occupation_constraints]
	query = ("SELECT COUNT(`id`) FROM `users` WHERE ({})".format(
			") AND (".join(filter(None, constraints)) or "1"))

	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	if VERBOSE:
		print("User nicheness query: {q}".format(q=query))

	cursor.execute(query)
	users_constrained = cursor.next()[0]

	cursor.execute("SELECT COUNT(`id`) FROM `users` WHERE 1")
	users_all = cursor.next()[0]

	return users_constrained / users_all

def get_programme_nicheness(genres=[], programmes=[], times=[]):
	if genres:
		genre_constraints = ("`programmes`.`genre` "
			"IN ('{genres}')".format(genres="','".join(genres)))
	else:
		genre_constraints = ""

	if programmes:
		programme_constraints = ("`programmes`.`id` "
			"IN ('{programmes}')".format(programmes="','".join(programmes)))
	else:
		programme_constraints = ""

	time_constraints = set()
	for start, end, day in times:
		constraint = []
		if start is not None:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%T') "
							">= '{start}'".format(start=start)]
		if end is not None:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%T') "
							"<= '{end}'".format(end=end)]
		if day is not None:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%w') "
							"= {day}".format(day=day)]
		if constraint:
			constraint = " AND ".join(constraint)
			time_constraints.add(constraint)
	if time_constraints:
		time_constraints = "(" + ") OR (".join(time_constraints) + ")"

	constraints = [genre_constraints, programme_constraints, time_constraints]
	query = ("SELECT COUNT(`id`) FROM `programmes` WHERE {}".format(
			" AND ".join(filter(None, constraints)) or "1"))
		
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	if VERBOSE:
		print("Programme nicheness query: {q}".format(q=query))

	cursor.execute(query)
	programmes_constrained = cursor.next()[0]

	cursor.execute("SELECT COUNT(`id`) FROM `programmes` WHERE 1")
	programmes_all = cursor.next()[0]

	return programmes_constrained / programmes_all

def get_nicheness(ageranges=[], boundingboxes=[], genders=[], genres=[],
					occupations=[], programmes=[], times=[]):
	user_nicheness = get_user_nicheness(ageranges, boundingboxes,
											genders, occupations)

	programme_nicheness = get_programme_nicheness(genres, programmes, times)

	if VERBOSE:
		print("User nicheness:\t{u}".format(u=user_nicheness))
		print("Programme nicheness:\t{p}".format(p=programme_nicheness))


	return user_nicheness * programme_nicheness

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
