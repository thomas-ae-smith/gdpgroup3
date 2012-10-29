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

def get_user_nicheness(ageranges=[], boundingboxes=[], genders=[], occupations=[]):
	now = datetime.datetime.now().date()

	age_constraints = (") OR (".join([
		" AND ".join(filter(None, [
			"`users`.`dob` > '{lower}'" if maxage else None,
			"`users`.`dob` < '{upper}'" if minage else None
		])).format(upper=now-relativedelta(years=minage or 0),
					lower=now-relativedelta(years=maxage or 0))
	for minage, maxage in ageranges]))
	age_constraints = "(" + age_constraints + ")" if age_constraints else None

	bb_constraints = (" OR ".join([
		" AND ".join(filter(None, [
			"`users`.`long` > '{longmin}'" if longmin else None,
			"`users`.`long` < '{longmax}'" if longmax else None,
			"`users`.`lat` > '{latmin}'" if latmin else None,
			"`users`.`lat` < '{latmax}'" if latmax else None
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
							"> '{start}'".format(start=start)]
		if end is not None:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%T') "
							"< '{end}'".format(end=end)]
		if day is not None:
			constraint += ["FROM_UNIXTIME(`programmes`.`start`, '%w') "
							"= {day}".format(day=day)]
		if constraint:
			constraint = "(" + " AND ".join(constraint) + ")"
			time_constraints.add(constraint)
	if time_constraints:
		time_constraints = "(" + " OR ".join(time_constraints) + ")"

	constraints = [genre_constraints, programme_constraints, time_constraints]
	query = ("SELECT COUNT(`id`) FROM `programmes` WHERE {}".format(
			" AND ".join(filter(None, constraints)) or "1"))
		
	conn = mysql.connector.connect(**credentials)
	cursor = conn.cursor()

	import pdb; pdb.set_trace()

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
			'ageranges':[(None, 20), (50, None)],
			'boundingboxes':[(51.28,51.686,-0.489,0.236)],
			'genders':['male'],
			'genres':['0', '1', '4', '8', '12'],
			'occupations':['0', '6', '8', '1', '9', '4'],
			'programmes':[],
			'times':[(None, None, 0), ("10:00:00", "22:00:00", None)],
		})

	input_dict = json.loads(args.json)

	print(get_nicheness(**input_dict), end='')
