#!/usr/bin/python2.7

from __future__ import division, print_function

import argparse
import datetime
from dateutil.relativedelta import relativedelta
import json
import time

import mysql.connector

from datastore.credentials import credentials

DEBUG = False

def get_user_nicheness(ageranges=[], boundingboxes=[], genders=[], occupations=[]):
	now = datetime.datetime.now().date()
	age_constraints = (" OR ".join([
		"(`users`.`dob` BETWEEN '{y1}' AND '{y2}')".format(
			y1=now-relativedelta(years=upper),
			y2=now-relativedelta(years=lower))
		for lower, upper in ageranges])) 

	bb_constraints = (" OR ".join([
		"(`users`.`long` BETWEEN '{longmin}' AND '{longmax}' "
		"AND `users`.`lat` BETWEEN '{latmin}' AND '{latmax}')".format(
			longmin=longmin, longmax=longmax, latmin=latmin, latmax=latmax)
		for latmin, latmax, longmin, longmax in boundingboxes]))

	if genders:
		gender_constraints = ("`users`.`gender` "
			"IN ({genders})".format(genders=",".join(genders)))
	else:
		gender_constraints = ""

	if occupations:
		occupation_constraints = ("`users`.`occupation` "
			"IN ({occupations})".format(occupations=",".join(occupations)))
	else:
		occupation_constraints = ""

	constraints = [age_constraints, bb_constraints, gender_constraints, 
		occupation_constraints]
	query = ("SELECT COUNT(`id`) FROM `users` WHERE {}".format(
			" AND ".join(filter(None, constraints)) or "1"))
		
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	cursor.execute(query)
	users_constrained = cursor.next()[0]

	cursor.execute("SELECT COUNT(`id`) FROM `users` WHERE 1")
	users_all = cursor.next()[0]

	return users_constrained / users_all

def get_programme_nicheness(genres=[], programmes=[], times=[]):
	if (not all(genres)) or (not all(programmes)) or (not all(times)) and DEBUG:
		print("At-least one input is false!")
		import pdb; pdb.set_trace()

	if genres:
		genre_constraints = ("`programme`.`genre` "
			"IN ({genres})".format(genres=",".join(genres)))
	else:
		genre_constraints = ""

	if programmes:
		programme_constraints = ("`programme`.`id` "
			"IN ({programmes})".format(programmes=",".join(programmes)))
	else:
		programme_constraints = ""

	time_constraints = set()
	for start, end, day in times:
		constraint = []
		if start:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%T') "
							"> {start}".format(start=start)]
		if end:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%T') "
							"< {end}".format(end=end)]
		if day:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%w') "
							"= {day}".format(day=day)]
		if constraint:
			constraint = "(" + " AND ".join(constraint) + ")"
			import pdb; pdb.set_trace() # Currently untested; check value of `constraint` is OK.
			time_constraints.add(constraint)
	if time_constraints:
		time_constraints = "(" + " OR ".join(time_constraints) + ")"

	

	constraints = [genre_constraints, programme_constraints, time_constraints]
	query = ("SELECT COUNT(`id`) FROM `programmes` WHERE {}".format(
			" AND ".join(filter(None, constraints)) or "1"))
		
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	cursor.execute(query)
	programmes_constrained = cursor.next()[0]

	cursor.execute("SELECT COUNT(`id`) FROM `programmes` WHERE 1")
	programmes_all = cursor.next()[0]

	import pdb; pdb.set_trace()

	return programmes_constrained / programmes_all

def get_nicheness(ageranges=[], boundingboxes=[], genders=[], genres=[],
									occupations=[], programmes=[], times=[]):
	user_nicheness = get_user_nicheness(ageranges, boundingboxes,
											genders, occupations)

	programme_nicheness = get_programme_nicheness(genres, programmes, times)

	return user_nicheness * programme_nicheness

def _init_argparse():
	parser = argparse.ArgumentParser(description="Given a set of restrictions, "
		"returns the nicheness of a campaign with those restrictions. Store "
		"this value in the 'nicheness' attribute of each campaign.")
	group = parser.add_mutually_exclusive_group()
	group.add_argument('-j', '--json', type=str,
						help="An input string in json format.")
	group.add_argument('-t', "--test", action='store_true',
						help="Runs using an example set of constraints for "
						"testing purposes.")
	parser.add_argument('-v', "--verbose", action='store_true',
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	if args.debug:
		DEBUG = True

	if args.test:
		args.json = json.dumps({
			'ageranges':[],
			'boundingboxes':[],
			'genders':[],
			'genres':[],
			'occupations':[],
			'programmes':[],
			'times':[]
		})

	input_dict = json.loads(args.json)

	print(get_nicheness(**input_dict), end='')
