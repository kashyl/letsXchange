$('input[type="file"]#item-photos').on('change', function () {
    $('#thumbs').empty()
    // loops through all the files
    for (var i = 0; i < this.files.length; i++) {
        // read the files selected for upload
        var fr = new FileReader()
        // on file load, it will append an img element to div#thumbs with the result as the source and size
        fr.onload = function (e) {
            $('#thumbs').append(`<img src="${e.target.result}" class="thumbnail" width="150px" height="150px">`)
        }
        fr.readAsDataURL(this.files[i])
    }
})
