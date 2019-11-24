$().ready(function () {
    /* Custom select design */
    $('.drop-down').append('<div class="button"></div>')
    $('.drop-down').append('<ul class="select-list"></ul>')
    $('.drop-down select option').each(function () {
        var bg = $(this).css('background-image')
        $('.select-list').append('<li class="clsAnchor"><span value="' + $(this).val() + '" class="' + $(this).attr('class') + '" style=background-image:' + bg + '>' + $(this).text() + '</span></li>')
    })
    $('.drop-down .button').html('<span style=background-image:' + $('.drop-down select').find(':selected').css('background-image') + '>' + $('.drop-down select').find(':selected').text() + '</span>' + '<a href="javascript:void(0);" class="select-list-link">Arrow</a>')
    $('.drop-down ul li').each(function () {
        if ($(this).find('span').text() === $('.drop-down select').find(':selected').text()) {
            $(this).addClass('active')
        }
    })
    $('.drop-down .select-list span').on('click', function () {
        var ddText = $(this).text()
        var ddImg = $(this).css('background-image')
        var ddVal = $(this).attr('value')
        $('.drop-down .button').html('<span style=background-image:' + ddImg + '>' + ddText + '</span>' + '<a href="javascript:void(0);" class="select-list-link">Arrow</a>')
        $('.drop-down .select-list span').parent().removeClass('active')
        $(this).parent().addClass('active')
        $('.drop-down select[name=options]').val(ddVal)
        $('.drop-down .select-list li').slideUp()
    })
    $('.drop-down .button').on('click', 'a.select-list-link', function () {
        $('.drop-down ul li').slideToggle()
    })
    /* End */
})
