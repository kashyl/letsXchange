#!/usr/bin/env node

/* To safely store passwords and keys: create a nameless .env file (".env") in root directory */
/* Populate it, e.g: EMAIL_PASS=... (newline) APP_KEYS=... */
/* To fetch keys: env.parsed.keyNameHere, for example: env.parsed.EMAIL_PASS */
const env = require('dotenv').config()

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

/**
 * Function for contact us message. Sent to site email (from site email)
 * @param {String} name - inputted name
 * @param {String} email - inputted email
 * @param {String} message - inputted message
 */
module.exports.contactUs = async (name, email, message) => {
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

/**
 * Function to send offer email
 * @param {String} body - object containing the offer (message and optional exchange item listing)
 * @param {String} buyer - object data of the user sending the offer
 * @param {String} sellerEmail - the email address of the item owner
 * @param {String} item - object data of the item offer is made on
 */
module.exports.sendOffer = async (body, buyer, sellerEmail, item) => {
    const message = `${body.message}`

    let text =
    `
    <html>
    <img src="https://drive.google.com/file/d/1ClOkUAgsNuAy16cJ1HaxBXWzg3xeaZ1f/view?usp=sharing">
    <h3>User ${buyer.user} has sent you an exchange offer for your listing (${item.title})</h3>
    <h4>Message:</h4> <p>${message}</p>
    </html>
    `

    if (body.offerItem !== '' && body.offerItem !== undefined) {
        text =
        `
        <html>
        <img src="https://drive.google.com/file/d/1ClOkUAgsNuAy16cJ1HaxBXWzg3xeaZ1f/view?usp=sharing">
        <h3>User ${buyer.user} has sent you an exchange offer for your listing (${item.title})</h3> 
        <h3>Message:/h3> <p>${message}</p> 
        <h3>Exchange Item</h3> 
        <h4 style="display: inline-block;">Title:</h4> ${body.offerItem.title}
        <h4 style="display: inline-block;">Category:</h4> ${body.offerItem.category}
        <h4>Description:</h4> <p>${body.offerItem.description}</p>
        </html>
        `
    }

    var mailOptions = {
        from: siteEmail.address,
        to: sellerEmail,
        subject: `${buyer.user} has sent you an exchange offer!`,
        html: text
    }
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}
