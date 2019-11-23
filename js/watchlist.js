
$('#watchlist').click(function () {
    const $this = $(this)
    if ($this.attr('class') === 'no') {
        $this.html('<i class="fas fa-heart"></i><span>Remove from watchlist</span>')
        $this.attr('class', 'yes')
    } else if ($this.attr('class') === 'yes') {
        $this.html('<i class="far fa-heart"></i><span>Add to watchlist</span>')
        $this.attr('class', 'no')
    }
})
