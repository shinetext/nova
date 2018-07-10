#!/usr/bin/python
# -*- coding: latin-1 -*-

import mysql.connector # SQL library of choice 
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
# existingcodes = [] 
ids = [] # auto increment id value from fb_users that is foreign key in user_referral_codes_v2
set1 = set()# sets are much faster to look up in than lists. 


return_value = "temp"

pull = ""

def genNewCode(code): # checks to see if generated code is a duplicate. pretty inefficient.
    exists = True

    while exists: # Loops until code is unique.  
        if code not in set1: 
            exists = False
        else:
            last_slash = code.rfind('-')
            num = code[last_slash-len(code) + 1:] # Save last character. 
            code = code[:last_slash-len(code) + 1] # Splice that removes last few characters. 
            num = int(num) + 1 # Increment character. 
            code += str(num)

    return code


def pull_info(): # pulls id and first_name from users_fb UNLESS the id exists in user_referral_codes_v2. Stores all in memory. 
    print("Pulling info from users_fb")
    cnx = mysql.connector.connect(**secrets.read_replica)

    cursor = cnx.cursor(buffered=True)

    min_id = 0
    max_id = 1000 

    while max_id < 1400000 or return_value == '': # until empty string is returned. 

        pull = "select id, first_name from users_fb where id >= {0} and id < {1}".format (min_id,  max_id)

        cursor.execute(pull)

        for user_id, first_name in cursor:
            records.append((user_id, first_name)) 

        min_id += 1000
        max_id += 1000
        # break

    cnx.close() 
    print("users_fb info pulled!")
    # generates like 1.3 million user ids and checks them against one another. 

def generateCodes(): # Generates codes

    print("Generating new codes...")
    for user_id, first_name in records:

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
        set1.add(final)
        ids.append(user_id)
    print("Codes generated!")

def InsertIds(): 
    print("Inserting ids into local db...")
    cnx = mysql.connector.connect(**secrets.local)
    cursor = cnx.cursor(buffered=True)

    send = zip(ids, codes) # order is maintained, but we should double check... 

    query = "insert into user_referral_codes_v2 (fb_user_id, v2_code) values(%s, %s)"

    cursor.executemany(query, send) # Right now, this sends them all at once. Need to figure out how to have this at a smaller scale. 
    
    cnx.commit()

    cnx.close() 
    print("ids inserted!")

print("The script begins!")

pull_info()

generateCodes()

InsertIds()

print("All done!")
