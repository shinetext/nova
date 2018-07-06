#!/usr/bin/python
# -*- coding: latin-1 -*-

import mysql.connector
import secrets # Local file that contains config info 
import re # regular expressions
import adj # 133 adjectives 
import test # test names 
import random # random generation

# create a connection pool 
    # https://dev.mysql.com/doc/connector-python/en/connector-python-connection-pooling.html

# pull down one thousand (?) records at a time 
    # https://dev.mysql.com/doc/connector-python/en/connector-python-example-cursor-select.html

# Script runs, like, 1345 times (L0L). Needs to save everything to local memory so that repeat codes are not created (?)

# use the same pool (??) to post records to the other table
    # https://dev.mysql.com/doc/connector-python/en/connector-python-example-cursor-transaction.html

records = [] # Records from users_fb we need
codes = [] # generated codes for user_referral_codes_v2
ids = []

return_value = "temp"

pull = ""


def genNewCode(code): 
    exists = True

    while exists: # Loops until code is unique.  
        if code not in codes: 
            exists = False
        else:
            num = code[-1] # Save last character. 
            code = code[:-1] # Splice that removes last character. 
            num = int(num) + 1 # Increment character. 
            code += str(num)

    return code

# This loop pulls all the records we need. 


def pull_ids(): 

    cnx = mysql.connector.connect(**secrets.config)

    cursor = cnx.cursor(buffered=True)

    min_id = 0
    max_id = 1000 

    while max_id < 20000 or return_value == '': # until empty string is returned. 

        pull = "select id, first_name from users_fb where id >= {0} and id < {1}".format (min_id,  max_id)

        cursor.execute(pull)

        for fb_messenger_id, first_name in cursor:
            records.append((fb_messenger_id, first_name)) 

        min_id += 1000
        max_id += 1000
        # break

    cnx.close() 

    # generates like 1.3 million user ids and checks them against one another. 


def generateCodes():
    for fb_messenger_id, first_name in records:

        if first_name is None:
            first_name = 'shine'

        first_name = first_name.lower().strip() # strip is the same as Trim().

        if '?' in first_name or first_name == "":
            first_name = 'shine' # no matter what, if there's a question mark it should become "shine"

        first_name = first_name.split()[0] 

        first_name = re.sub('[^a-z]', '', first_name)

        # now, all off character names should be null. Need to check again.  

        if first_name == "":
            first_name = "shine" 


        tempCode = random.choice(adj.adjectives) + "-" + first_name + "-" + "1"

        final = genNewCode(tempCode) # checks against store of codes. 

        codes.append(final)
        ids.append(fb_messenger_id)

def InsertIds(): 
    send = zip(ids, codes) # order is maintained, but we should double check... 

    query = "insert into user_referral_codes_v2 (v2_code, fb_user_id) values %s %s"
    print(send)

    # cursor.execute(query, send) # Right now, this sends them all at once. Need to figure out how to have this at a smaller scale. 


pull_ids()

generateCodes()

InsertIds()

#for code 

# goes through and inserts into database.

    #push = "insert into user_referral_codes_v2 (id, v2_code, fb_user_id) values %s %s %s"


    # is id automaically defined by the schema, or will we need to pull the last record to get the proper id number?




# cnx = mysql.connector.connect(**secrets.config)

# cursor = cnx.cursor()

# cnx.close() 