#!/usr/bin/python2.7

from __future__ import print_function, division

import argparse
import random
from time import time
import sys

from datastore import interface

DEBUG = False
VERBOSE = False

def get_ad(uid, pid, when=time(), maxlen=float('inf')):
	# Get all adverts available for a given user, programme and time.
	advert_pool = interface.get_advert_pool(uid, pid, when, maxlen)

	if not advert_pool:
		print("No valid adverts returned for uid={uid}, pid={pid}, "
				"when={when}, max_length={maxlen}!".format(
					uid=uid, pid=pid, when=when, maxlen=maxlen),
				file=sys.stderr)
		return -1

	if VERBOSE:
		print("Valid adverts for uid={uid}, pid={pid}, "
			"when={when}:".format(uid=uid, pid=pid, when=when))
		for campaignid, campaign in advert_pool.iteritems():
			print("campaign:{campaign}, nicheness:{nicheness} "
				"adverts:{adverts}".format(
					campaign=campaignid,
					nicheness=campaign.nicheness,
					adverts=campaign.adverts))

	# Pick a campaign with a probability based on the nicheness.
	nicheness, adverts = zip(*sorted([(c.nicheness, c.adverts)
										for c in advert_pool.values()]))

	if sum(nicheness) == 0:
		# Flatten and pick one randomly.
		adset = [item for sublist in adverts for item in sublist]
	else:
		viewChance = [(sum(nicheness[:n+1])/sum(nicheness), adverts[n])
						for n in xrange(len(nicheness))]

		r = random.random()
		for n, ads in viewChance:
			if r <= n:
				adset = ads
				break

	return random.choice(adset)
			
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
	parser.add_argument('max_length', metavar='max_length', type=float, nargs='?',
						default=float('inf'), help="The maximum length of the "
						"advert in seconds. Defaults to infinity. Can be set "
						"to infinity by passing 0 or the empty string.")
	parser.add_argument('start_time', metavar='start_time', type=int, nargs='?',
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

	if not args.max_length:
		args.max_length = float('inf')

	ad_id = get_ad(args.uid, args.pid, args.start_time, args.max_length)
	print(ad_id, end='')
