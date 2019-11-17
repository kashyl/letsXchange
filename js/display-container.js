$(document).mouseup(function (e) {
  var container = $('.login')
  var button = $('#login-show')

  // if the target of the click is NOT CONTAINER nor a descendant of the CONTAINER
  if (!container.is(e.target) && container.has(e.target).length === 0) {
    // if the target of the click is NOT BUTTON nor a descendant of the BUTTON ...
    if (!button.is(e.target) && button.has(e.target).length === 0) {
      // ... set CONTAINER to HIDDEN and BUTTON to INACTIVE
      container.attr('hidden', true)
      button.attr('class', 'inactive')

      // ELSE, if the target of the click IS BUTTON ...
    } else if (button.is(e.target)) {
      // if CONTAINER is VISIBLE (hidden property undefined), HIDE
      var attr = $(container).attr('hidden')
      if (!(typeof attr !== typeof undefined && attr !== false)) {
        container.attr('hidden', true)
        button.attr('class', 'inactive')

      // OR, if CONTAINER is HIDDEN, SHOW IT
      } else {
        container.attr('hidden', false)
        button.attr('class', 'active')
      }
    }
  }
})
