$('.open-button').click(function (e) {
    $('.dropdown').show()
    e.stopPropagation()
})

$('.dropdown').click(function (e) {
    e.stopPropagation()
})

$(document).click(function () {
    $('.dropdown').hide()
})
