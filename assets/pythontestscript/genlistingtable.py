num = int(50)
value = ""
currentval = 1
for i in range(0, int(num/5)):
    value = value + "<tr> \n"
    for x in range(0, 5):
        value = value + '<th class="listing">Listing' + str(currentval) + "</th> \n"
        currentval += 1
    value = value + "</tr> \n"
print(value)
