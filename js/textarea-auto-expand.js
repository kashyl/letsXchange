
function growTextarea (i, elem) {
    elem = $(elem)
    var resizeTextarea = function (elem) {
        var scrollLeft = window.pageXOffset || (document.documentElement || document.body.parentNode || document.body).scrollLeft
        var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop
        elem.css('height', 'auto').css('height', elem.prop('scrollHeight'))

        window.scrollTo(scrollLeft, scrollTop)
    }
    elem.on('input', function () {
        resizeTextarea($(this))
    })
    resizeTextarea($(elem))
}

$('.jTextarea').each(growTextarea)

/* old - works but has jumping scrollbar issue on long text
$('textarea').each(function () {
    this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;')
}).on('input', function () {
    this.style.height = 'auto'
    this.style.height = (this.scrollHeight) + 'px'
}) */
