var today = new Date()
var hourNow = today.getHours()
var greeting

if (hourNow > 18) {
  greeting = 'Good evening'
} else if (hourNow > 12) {
  greeting = 'Good afternoon'
} else if (hourNow > 5) {
  greeting = 'Good morning'
} else if (hourNow >= 0) {
  greeting = 'Hello'
}

document.getElementById('time-greet').innerHTML = greeting
// document.write('<h3 class="time-greet">' + greeting + '</h3>')
