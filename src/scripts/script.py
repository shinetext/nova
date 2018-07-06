#!/usr/bin/python
# -*- coding: latin-1 -*-


import re # regular expressions
import adj # 133 adjectives 
import test # test names 
import random # random generation





'''
EXAMPLE FIRST NAME:
ie.  -M’ichael john  

Format name:

1.) If non-latin name (????) then use ‘shine’ as first name
1.) Trim() leading & trailing white space
2.) If multiple parts to first name, get only 1st part of the name (ie. ‘Michael’ in ‘Michael John’
3.) Remove any special characters : -M’ichael    —> Michael
4.) lower case all charccters - Michael -> michael
'''






cleaned = []
tempCode = ""
code = []

for each in test.testName:

    each = each.lower().strip() # strip is the same as Trim().

    if '?' in each or each == "":
        each = 'shine' # no matter what, if there's a question mark it should become "shine"

    each = each.split()[0] 

    each = re.sub('[^a-z]', '', each)

    # now, all off character names should be null. 

    if each == "":
        each = "shine" 

    cleaned.append(each)

    tempCode = random.choice(adj.adjectives) + "-" + each + "-" + "1"

    exists = True

    while exists: # Loops until code is unique.  
        if tempCode not in code: 
            exists = False
        else: 
            num = tempCode[-1]
            tempCode = tempCode[:-1]
            num = int(num) + 1
            tempCode += str(num)

    code.append(tempCode) 

print(code)