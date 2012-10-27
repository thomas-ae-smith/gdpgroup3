#!/usr/bin/python2.7

from __future__ import print_function

import argparse
import inspect
import os
import sys

import tvdb_api

from datastore.vector import vector_to_string
from util.strconvert import latin1_to_ascii

_filepath = os.path.dirname(os.path.abspath(
				inspect.getfile(inspect.currentframe())))
_tvdb = tvdb_api.Tvdb(cache=_filepath+"/tvdb_cache")

_genre_convert = {
	"Action and Adventure":0,
	"Animation":1,
	"Children":2,
	"Comedy":3,
	"Documentary":4,
	"Drama":5,
	"Game Show":6,
	"Home and Garden":7,
	"Mini-Series":8,
	"News":9,
	"Reality":10,
	"Science-Fiction":11,
	"Fantasy":12,
	"Soap":13,
	"Special Interest":14,
	"Sport":15,
	"Talk Show":16,
	"Western":17,
	"Unclassified":18
}

def get_programme_vector(title):
	"""Given a programme name, returns a vector representing that programme
	to be used by the recommender"""
	title = latin1_to_ascii(title)
	genre_vec = [0] * len(_genre_convert)
	try:
		tvdb_genres = _tvdb[title]['genre']

		for genre in filter(None, tvdb_genres.split('|')):
			genre_vec[_genre_convert[genre.rstrip()]] = 1
		if not tvdb_genres:
			print("Empty genre list returned by tvdb: "+title, file=sys.stderr)
	except AttributeError:
		print("No 'genre' attribute returned by tvdb: "+title, file=sys.stderr)
	except tvdb_api.tvdb_shownotfound:
		print("Not found by tvdb: "+title, file=sys.stderr)
	except KeyError:
		print("KeyError returned by tvdb: "+title, file=sys.stderr)
	except tvdb_api.tvdb_error:
		print("Error 'tvdb_error', possibly malformed repsonse: "+title,
				file=sys.stderr)
	except IndexError:
		print("IndexError returned by tvdb; has the limit been "
				"exceeded?: "+title, file=sys.stderr)

	if not any(genre_vec):
		genre_vec[_genre_convert['Unclassified']] = 1

	return genre_vec

# If called from the commandline.
if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Given a programme name, "
	"returns the initialization vector for the programme.")
	parser.add_argument('name', metavar='programme_name', type=str,
						help="The name of the programme.")
	args = parser.parse_args()
	print(vector_to_string(get_programme_vector(args.name)), end='')
