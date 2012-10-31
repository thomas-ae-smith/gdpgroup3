#!/usr/bin/python2.7

#TODO: Database has been updated; campaigns now have multiple ads. Reflect this. Return campaign ads with equal probability.

from __future__ import print_function, division

import argparse
from random import random
from time import time

from datastore import interface

DEBUG = False
VERBOSE = False

def get_advertisement(uid, pid, when=time()):
	# Get all adverts available for a given user, programme and time.
	advert_pool = interface.get_advert_pool(uid, pid, when)

	if not advert_pool:
		if VERBOSE:
			print("No valid campaigns returned for uid={uid}, pid={pid}, "
				"when={when}:".format(uid=uid, pid=pid, when=when))
		return -1

	if VERBOSE:
		print("Valid campaigns for uid={uid}, pid={pid}, "
			"when={when}:".format(uid=uid, pid=pid, when=when))
		for ad_id, nicheness in advert_pool.iteritems():
			print("{ad}\t\t{nicheness}".format(ad=ad_id, nicheness=nicheness))

	# Pick an advert with a probability based on the nicheness.
	advertids, nichenesses = zip(*advert_pool.iteritems())
	roulette = {sum(nichenesses[:n+1]):advertids[n]
					for n in xrange(len(advertids))}
	roulette_spin = random() * sum(nichenesses) 

	for k, v in roulette.iteritems():
		if roulette_spin <= k:
			outcome = v
			break
		else:
			pass

	return outcome

def _init_argparse():
	parser = argparse.ArgumentParser(description="Given a userid, a programme "
		"id and a unix timestamp, returns the id of a targetted advert. If no "
		"valid adverts can be found for the specified user, programme and "
		"time, -1 is returned. If no timestamp is specified, it defaults to "
		"right now.")
	parser.add_argument('uid', metavar='user_id', type=int,
						help="The ID of a user")
	parser.add_argument('pid', metavar='programme_id', type=int,
						help="The ID of the programme the user is currently "
							"watching")
	parser.add_argument('time', metavar='time', type=int, nargs='?',
						default=time(), help="A unix timestamp representing "
						"when the advert is to be shown.")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")
	return parser.parse_args()

# If called from the commandline.
if __name__ == "__main__":
	args = _init_argparse()

	DEBUG = args.debug
	VERBOSE = args.verbose

	print(get_advertisement(args.uid, args.pid, args.time), end='')
