#!/usr/bin/python2.7

from __future__ import division

import cPickle as pickle
import numpy
from PyML import VectorDataSet

import pdb

users = {}	# UserID -> Demographics vector
movies = {}	# FilmID -> Genre vector
ratings = {}# UserID -> MovieID list

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

		age = age_convert[age]
		gender = int(gender == "M")
		occupation = [0]*int(occupation) + [1] + [0]*(20-int(occupation))

		users[userid] = [age] + [gender] + occupation
		ratings[userid] = []

# Populate movies dict
with open("movies.dat", "rb") as MOVIES:
	genre_convert = {
		"Action":0,
		"Adventure":1,
		"Animation":2,
		"Children's":3,
		"Comedy":4,
		"Crime":5,
		"Documentary":6,
		"Drama":7,
		"Fantasy":8,
		"Film-Noir":9,
		"Horror":10,
		"Musical":11,
		"Mystery":12,
		"Romance":13,
		"Sci-Fi":14,
		"Thriller":15,
		"War":16,
		"Western":17
	}
	for movie in MOVIES:
		movieid, title, genres = movie.split("::")
		genre_vec = [0] * len(genre_convert)
		for genre in genres.split("|"):
			genre_vec[genre_convert[genre.rstrip()]] = 1

		movies[movieid] = genre_vec

# Populate ratings dict
with open("ratings.dat", "rb") as RATINGS:
	for rating in RATINGS:
		userid, movieid, r, timestamp = rating.split("::")
		r = (int(r) - 1)/4

		if r == 1:
			# inputs.append(users[userid])
			# outputs.append(movies[movieid])
			if movieid == '0': pdb.set_trace()
			ratings[userid] += [movieid]

inputs = []
outputs = []
for userid, movieids in ratings.iteritems():
	if movieids:
		movieVecs = [movies[mid] for mid in movieids]
		meanMovieVec = [sum(v[n] for v in movieVecs) for n in xrange(len(movieVecs[0]))]

		inputs += [users[userid]]
		outputs += [meanMovieVec]

with open("ml_data.inputs", "wb") as INPUTS:
	pickle.dump(numpy.matrix(inputs), INPUTS)

with open("ml_data.outputs", "wb") as OUTPUTS:
	pickle.dump(numpy.matrix(outputs), OUTPUTS)
