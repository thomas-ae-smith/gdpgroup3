#!/usr/bin/python2.7

from __future__ import print_function, division

import argparse
import random
import time
import sys

from datastore import interface

DEBUG = False
VERBOSE = False

def get_ad(uid, pid, when=None, maxlen=float('inf'), exclude=(), live=True):
	if when is None:
		when = time.time()
	# Get all adverts available for a given user, programme and time.
	advert_pool = interface.get_advert_pool(uid, pid, when, maxlen, exclude, live)

	if not advert_pool:
		print("No valid adverts returned for uid={uid}, pid={pid}, "
				"when={when}, max_length={maxlen}, exclude=[{ex}]!".format(
					uid=uid, pid=pid, when=when, maxlen=maxlen,
					ex=','.join(str(p) for p in exclude)),
				file=sys.stderr)
		return -1

	if VERBOSE:
		print("Valid adverts for uid={uid}, pid={pid}, "
			"when={when}:".format(uid=uid, pid=pid, when=when))
		for campaignid, campaign in advert_pool.iteritems():
			print("campaign:{campaign}, nicheness:{nicheness} "
				"adverts:{adverts}, exclude=[{ex}]".format(
					campaign=campaignid,
					nicheness=campaign.nicheness,
					adverts=campaign.adverts,
					ex=','.join(str(p) for p in exclude)))

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
						default=None, help="A unix timestamp representing "
						"when the advert is to be shown.")
	parser.add_argument('-l', "--live", action="store_true",
						help="Return ads for a live showing of this programme.")
	parser.add_argument('-x', "--exclude", type=int, default=(),
						nargs='+', help="Given a list of advert ids, will "
						"not return an advert id withis this list.")
	parser.add_argument('-v', "--verbose", action="store_true",
						help="Prints more information to stdout.")
	parser.add_argument('-d', "--debug", action="store_true",
						help="If true, breaks using pdb in a number of cases.")

	args = parser.parse_args()
	if args.start_time is None:
		args.start_time = time.time()
	return args

# If called from the commandline.
if __name__ == "__main__":
	args = _init_argparse()

	DEBUG = args.debug
	VERBOSE = args.verbose

	if not args.max_length:
		args.max_length = float('inf')

	ad_id = get_ad(args.uid, args.pid, args.start_time, args.max_length,
					exclude=args.exclude, live=args.live)
	print(ad_id, end='')
