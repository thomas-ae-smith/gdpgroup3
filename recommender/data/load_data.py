import cPickle as pickle
import pdb

import tvdb_api

DATA_FILE = "data"
HASH_FILE = "data.hash"
PROCESSED_FILE = "data.processed"

_t = tvdb_api.Tvdb()

def get_matrix():
	with open(DATA_FILE, 'r') as datafile:
		with open(HASH_FILE, 'r') as datahash:
			cached = (hash(datafile) == datahash.read().strip())

		if not cached:
			watched = {}
			for record in datafile:
				record = record.split('\t')
				try:
					watched[record[0]] += [get_vector(record[1:])]
				except KeyError:
					watched[record[0]] = [get_vector(record[1:])]

			mat = []
			for user, progVecs in watched.iteritems():
				# Add the mean programme vector for a single user to mat.
				mat += [[sum(v[n] for v in progVecs)/len(progVecs)
						for n in xrange(len(progVecs[0]))]]
			with open(PROCESSED_FILE, 'w') as processedfile:
				pickle.dump(mat, processedfile)
			with open(HASH_FILE, 'w') as datahash:
				datahash.write(str(hash(datafile)))
		else:
			with open(PROCESSED_FILE, 'r') as processedfile:
				mat = pickle.load(processedfile)
	return mat

def get_vector(data):
	name, genre, type, rating = data
	return [0,0,0,0]

def tvdb_query(programme_name):
	"""Takes a programme name and returns extra programme data acuired from
	tvdb in a dict."""

	contentrating = _t[programme_name]['contentrating']
	rating = _t[programme_name]['rating']

	# Removes anything 'false' from the list (empty strings)
	genres = filter(None, _t[programme_name]['genre'].split("|"))

	return {
		"rating":rating,
		"contentrating":contentrating,
		"genres":genres
	}
