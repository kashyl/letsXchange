#!/usr/bin/env node
/* eslint-disable */

/* To safely store passwords and keys: create a nameless .env file (".env") in root directory */
/* Populate it, e.g: EMAIL_PASS=... (newline) APP_KEYS=... */
/* To fetch keys: env.parsed.keyNameHere, for example: env.parsed.EMAIL_PASS */
const env = require('dotenv').config();

/**
 * Email module
 * @module modules/email
 */

// FETCH KEYS FROM ENV VARIABLES
const siteEmail = { address: env.parsed.EMAIL_ADDRESS, pass: env.parsed.EMAIL_PASS }

var nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: siteEmail.address,
    pass: siteEmail.pass
  }
})

module.exports.contactUs = async(name, email, message) => {
  var mailOptions = {
    from: siteEmail.address,
    to: siteEmail.address,
    subject: `Contact Us: ${name} - ${email}`,
    text: message
  }
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}
