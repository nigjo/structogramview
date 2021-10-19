#let's do this all together
CONCURRENT:
print current sum
IF: testen?
genau
ENDIF:
do something else
ENDCONCURRENT:
CONCURRENT:
THREAD:
print current sum
THREAD:
IF: testen?
genau
ENDIF:
THREAD:
do something else
ENDCONCURRENT:
RETURN: What ever this will create
