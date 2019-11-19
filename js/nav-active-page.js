$(function () {
    var active = location.pathname
    // comparing current path with all the elements 'nav li a'
    $('nav li a').each(function () {
        var $this = $(this)
        var str = $this.attr('href')

        // if on home page
        if (active === '/') {
            $('nav ul li a[href="/"]').addClass('active')
            return true
        }
        // if current url is same as href value of nav li a element
        // make it active
        if ((active) === ('/' + str)) {
            $('nav ul li a[href="' + str + '"]').addClass('active')
        }
    })
})
