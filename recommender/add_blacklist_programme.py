#!/usr/bin/python2.7

from __future__ import print_function

import argparse

from datastore import interface

DEBUG = False
VERBOSE = False

def add_programme_blacklist(userId, programmeId):
	interface.add_programme_blacklist(userId, programmeId)

def _init_argparse():
	parser = argparse.ArgumentParser()
	parser.add_argument('userid', metavar='userid', type=int, help="The is of "
						"the user in the local datastore.")
	parser.add_argument('programmeid', metavar='programmeid', type=int,
						help="The id of the programme to be blacklisted.")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline
if __name__ == "__main__":
	args = _init_argparse()

	DEBUG = bool(args.debug)
	VERBOSE = bool(args.verbose)

	add_programme_blacklist(args.userid, args.programmeid)
