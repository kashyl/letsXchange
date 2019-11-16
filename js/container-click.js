$(document).on('click', function (e) {
  if ($(e.target).closest('#CONTAINER').length === 0) {
    $('#CONTAINER').hide()
  }
})
