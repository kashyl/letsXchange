/* eslint-disable no-unused-vars */
const greeting = require('/js/time-greeting.js');

test('Checks the current time and displays a relavent greeting to the user'), () => {
    expect(hourNow(0).toBe('Hello There'));
    expect(hourNow(11).toBe('Good morning'));
    expect(hourNow(12).toBe('Good afternoon'));
    expect(hourNow(18).toBe('Good evening'));
    expect(hourNow(23).toBe('Good evening'));
}