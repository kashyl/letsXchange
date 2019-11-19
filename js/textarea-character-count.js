// jQuery function to count characters left in textarea
// $('.character-count').html(`0 / ${$('textarea').attr('maxlength')}`)

$('textarea').on('input', function () {
    var maxlength = $(this).attr('maxlength')
    var currentLength = $(this).val().length

    $(`#${$(this).attr('id')}.character-count`).html(`${currentLength} / ${maxlength}`)

    /* if (currentLength >= maxlength) {
        console.log('You have reached the maximum number of characters.')
    } else {
        console.log(maxlength - currentLength + ' chars left')
    } */
})
