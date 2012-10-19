from __future__ import print_function

import argparse

import mysql.connector

parser = argparse.ArgumentParser(description="Given a user ID, returns a "
"channel recoomended for the user to switch to after their current programme "
"has finished.")

parser.add_argument('user_id', metavar='uid', type=str,
					help="The ID of a user")

args = parser.parse_args()

query = (	'SELECT `vector` '
			'FROM `users` '
			'WHERE `id` = %s')

conn = mysql.connector.connect(user=credentials['username'],
							password=credentials['password'],
							database=credentials['db'],
							host=credentials['host'],
							port=credentials['port'])
cursor = conn.cursor()

cursor.execute(query, args.user_id)

print("1", end='')
