#!/usr/local/bin/python2.7

from __future__ import print_function

import argparse

import mysql.connector

from ..

parser = argparse.ArgumentParser(description="Adds a new user to the database "
"along with their preference vector initialised by the recommender")
parser.add_argument('male', metavar='m', type=bool, help="The gener of the "
					"user to be added. True if male, false if female."
parser.add_argument('age', metavar='age', type=int, help="The age of the "
					"user to be added in years.")



