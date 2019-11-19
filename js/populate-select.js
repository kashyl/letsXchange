const dropdown = $('select.loadjson')

const name = dropdown.attr('name')

// dropdown.empty()

// dropdown.append('<option disabled selected> Choose an option </option>')
// dropdown.prop('selectedIndex', 0)

const path = `../assets/json/${name}.json`

// Populate dropdown with list from json
$.getJSON(path, function (data) {
    $.each(data, function (key, entry) {
        dropdown.append($('<option></option>').attr('value', entry.name).text(entry.name))
    })
})
