#!/usr/bin/python2.7

from __future__ import print_function

import argparse

from datastore import interface

DEBUG = False

def get_advertisement(uid, pid):
	advert_pool = interface.get_advert_pool(uid, pid)
	return advert_pool

def _init_argparse():
	parser = argparse.ArgumentParser(description="Given a userid and a "
		"programme, returns a targetted advert")
	parser.add_argument('uid', metavar='user_id', type=int,
						help="The ID of a user")
	parser.add_argument('pid', metavar='programme_id', type=int,
						help="The ID of the programme the user is currently "
						"watching")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline.
if __name__ == "__main__":
	args = _init_argparse()

	DEBUG = args.debug

	print(get_advertisement(args.uid, args.pid), end='')
