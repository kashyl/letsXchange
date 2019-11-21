$(window).on('load', function () {
    const dropdown = $('datalist#searchbar.loadjson')

    const jsonFileName = dropdown.attr('class').split(' ')[0]

    // dropdown.empty()

    // dropdown.append('<option disabled selected> Choose an option </option>')
    // dropdown.prop('selectedIndex', 0)

    const path = `../assets/json/${jsonFileName}.json`

    // Populate dropdown with list from json
    $.getJSON(path, function (data) {
        $.each(data, function (key, entry) {
            dropdown.append($('<option></option>').attr('value', entry.name))
        })
    })
})
