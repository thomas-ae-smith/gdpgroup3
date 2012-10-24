from __future__ import division

import numpy

def string_to_vector(string):
	""" Given a string representing a vector returned from the datastore, 
	returns a numpy array representation of the vector. The precision is capped 
	to 12 s.f for the purpose of restricting each vector element inthe database 
	to 14 characters plus 1 character for the separator."""

	cat = lambda s: round(float(s.strip()), 12)
	if string.startswith('['):	# This is here for legacy reasons.
		return numpy.array([cat(e) for e in string[1:-1].split(", ")])
	else:
		return numpy.array([cat(e) for e in string.split(",")])

def vector_to_string(vector, max_size=285):
	"""Turns an iterable into a string suitable to be stored in the database 
	and translated back into a numpy array by the `string_to_vector` method.
	`max_size` MUST be <= the size of the varchar used to store the vector data.
	"""

	chars_per_el = (max_size // len(vector)) - 1
	return ",".join([str(e)[:chars_per_el] for e in vector])
