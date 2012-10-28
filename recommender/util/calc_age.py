from datetime import date

def calc_age(born):
	"""Calculate the age of a user."""
	today = date.today()
	try:
		birthday = date(today.year, born.month, born.day)
	except ValueError:
		# Raised when person was born on 29 February and the current
		# year is not a leap year.
		birthday = date(today.year, born.month, born.day - 1)
	if birthday > today:
		return today.year - born.year - 1
	else:
		return today.year - born.year
