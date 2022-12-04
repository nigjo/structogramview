initialize application
IF: everything OK?
  play some tone
ELSE:
  output error message
ENDIF:
FOR: from 1 to 10
  add counter to sum
  SELECT: index
  CASE: 1
    print "first"
  CASE: 5
    print "center"
  CASE: 10
    print "last"
  DEFAULT:
    print index
  ENDSELECT:
ENDFOR:
#fancy things are sometimes really strange
CALL: do something fancy to sum
print current sum
LOOP: 
  #loops are cool
  #      and newlines too
  IF: current sum is odd
    add 1 to sum
  ENDIF:
  divide sum by 2
ENDLOOP: sum > 10
RETURN: calculated result
