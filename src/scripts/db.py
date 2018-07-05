import mysql.connector
import secrets # Local file that contains config info 

# create a connection pool 
	# https://dev.mysql.com/doc/connector-python/en/connector-python-connection-pooling.html

# pull down one thousand (?) records at a time 
	# https://dev.mysql.com/doc/connector-python/en/connector-python-example-cursor-select.html

# Script runs, like, 1345 times. Needs to save everything to local memory so that repeat codes are not created? 

# use the same pool (??) to post records to the other table
	# https://dev.mysql.com/doc/connector-python/en/connector-python-example-cursor-transaction.html

# OR: 

# create a connection pool 
	# https://dev.mysql.com/doc/connector-python/en/connector-python-connection-pooling.html

# pull down one thousand (?) records at a time 
	# https://dev.mysql.com/doc/connector-python/en/connector-python-example-cursor-select.html

# Check codes against existing codes in the referal codes v2 table. 

# use the same pool (??) to post records to the other table as they are generated. 
	# https://dev.mysql.com/doc/connector-python/en/connector-python-example-cursor-transaction.html



# Pulling the data in a loop: 

return_value = "temp"

min_id = 0
max_id = 1000 

pull = ""

while return_value: # until empty string is returned. 

	pull = "select * from users_fb where id >= {0} and id < {1}".format (min_id,  max_id)

	min_id += 1000 
	max_id += 1000 

	print(pull)

	# cursor.execute(pull) # execute query 

for facebook_messenger_id, user_id in cursor:
	# goes through and inserts into database.

	push = "insert into user_referral_codes_v2 () where  "




# cnx = mysql.connector.connect(**secrets.config)

# cnx.close() 