$('select.multiple-select option').mousedown(function (e) {
    e.preventDefault()
    var originalScrollTop = $(this).parent().scrollTop()
    // console.log(originalScrollTop)
    $(this).prop('selected', !$(this).prop('selected'))
    var self = this
    $(this).parent().focus()
    setTimeout(function () {
        $(self).parent().scrollTop(originalScrollTop)
    }, 0)
    return false
})

$('button.clear-select').click(function () {
    const elemid = $(this).attr('name')
    $(`#${elemid}`).val([])
})
