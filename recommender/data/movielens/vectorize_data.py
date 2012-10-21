#!/usr/bin/python2.7

from __future__ import division
from __future__ import print_function

import cPickle as pickle
import sys

import numpy
from PyML import VectorDataSet
import tvdb_api

from str_convert import latin1_to_ascii

users = {}	# UserID -> Demographics vector
movies = {}	# FilmID -> Genre vector
ratings = {}# UserID -> MovieID list

DEFAULT_RECURSION_LIMIT = sys.getrecursionlimit()

# Populate users dict, init ratings dict
with open("users.dat", "rb") as USERS:
	age_convert = {
		"1"	:12,
		"18":21.5,
		"25":30,
		"35":40,
		"45":47.5,
		"50":53,
		"56":60
	}
	for user in USERS:
		userid, gender, age, occupation, zipcode = user.split("::")

		# occupation = [0]*int(occupation) + [1] + [0]*(20-int(occupation))
		if occupation == "4":
			age = age_convert[age]
			gender = int(gender == "M")

			users[userid] = [age] + [gender]
			ratings[userid] = []

_useful_movieids = set() # ids of all movies watched by students.
# Populate ratings dict
with open("ratings.dat", "rb") as RATINGS:
	for rating in RATINGS:
		userid, movieid, r, timestamp = rating.split("::")
		if r in {'4', '5'}:
			try:
				ratings[userid] += [movieid]
				_useful_movieids.add(movieid)
			except KeyError:
				pass

tvdb = tvdb_api.Tvdb(cache="../../../datastore/tvdb_cache")

# Populate movies dict
with open("movies.dat", "rb") as MOVIES:
	genre_convert = {
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
	_done = 0
	for movie in MOVIES:
		movieid, title, genres = movie.split("::")
		if movieid in _useful_movieids: # Only pull details if they're useful.
			_done += 1
			title = latin1_to_ascii(title.strip()[0:-7])
			print("{done}/{togo}: ".format(done=_done, togo=len(_useful_movieids)),
					end='')
			try:
				tvdb_genres = tvdb[title]['genre']
				if not tvdb_genres:
					print("Empty genre list returned by tvdb: "+title)
			except AttributeError:
				print("No 'genre' attribute returned by tvdb: "+title)
				tvdb_genres = None
			except tvdb_api.tvdb_shownotfound:
				print("Not found by tvdb: "+title)
				tvdb_genres = None
			except KeyError:
				print("KeyError returned by tvdb: "+title)
				tvdb_genres = None
			except tvdb_api.tvdb_error:
				print("Error 'tvdb_error', possibly malformed repsonse: "+title)
				tvdb_genres = None
			except IndexError as err:
				print("IndexError. WTF?!?!?!?: "+title)
				tvdb_genres = None

			if tvdb_genres:
				genre_vec = [0] * len(genre_convert)
				for genre in filter(None, tvdb_genres.split('|')):
					genre_vec[genre_convert[genre.rstrip()]] = 1
				movies[movieid] = genre_vec

				print("Success: "+title+"\t\t\t\t*")


inputs = []
outputs = []
for userid, movieids in ratings.iteritems():
	movieids = list(set(movieids) & set(movies.keys()))
	if movieids:
		movieVecs = [movies[mid] for mid in movieids]
		meanMovieVec = [sum(v[n] for v in movieVecs)
						for n in xrange(len(movieVecs[0]))]

		inputs += [users[userid]]
		outputs += [meanMovieVec]

assert len(inputs) == len(outputs)

import pdb; pdb.set_trace()

with open("ml_data.inputs", "wb") as INPUTS:
	pickle.dump(numpy.matrix(inputs), INPUTS)

with open("ml_data.outputs", "wb") as OUTPUTS:
	pickle.dump(numpy.matrix(outputs), OUTPUTS)

print("Written {p} patterns".format(p=len(inputs)))
