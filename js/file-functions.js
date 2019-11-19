$(function () {
    // Define maximum number of files
    var maxFileNumber = 5

    // Define form id or class or just tag
    var $form = $('form')

    // Define upload field class or id or tag
    var $fileUpload = $('#item-photos', $form)

    // Define submit class or id or tag
    var $button = $('.submit', $form)

    $fileUpload.on('change', function () {
        // Disable submit button on field change
        // If no images are uploaded, submit will take care of that
        // as long as the input is required
        $button.prop('disabled', 'disabled')
        var uploadedFileNumber = $(this)[0].files.length

        // clear any previous upload thumbnails
        $('#thumbs').empty()

        // if the number of uploaded files exceeds the maximum defined above
        // raise an alert to the user to let them know they exceeded it
        // disable / keep disabled the submit button
        if (uploadedFileNumber > maxFileNumber) {
            alert(`You can upload maximum ${maxFileNumber} files.`)
            $(this).val('')
            $button.prop('disabled', 'disabled')
        } else {
            // if the number of files doesn't exceed the maximum number
            // begin loading the thumbnails in the div#thumbs container

            // loops through all the files
            for (var i = 0; i < this.files.length; i++) {
            // read the files selected for upload
                var fr = new FileReader()
                // on file load, it will append an img element to div#thumbs with the result as the source
                // sets its class as "thumbnail" as selector for the page stylesheet
                fr.onload = function (e) {
                    $('#thumbs').append(`<div class="thumbnail-container"><img src="${e.target.result}" class="thumbnail"></div>`)
                }
                fr.readAsDataURL(this.files[i])
            }
            $button.prop('disabled', false)
        }
    })
})
