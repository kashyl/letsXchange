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
 * @param {String} itemid - object id of the image that needs to be included in the email
 */
module.exports.sendOffer = async (body, buyer, sellerEmail, item, itemid) => {
    const message = `${body.message}`

    let serverURL = 'http://server.alastairserver.co.uk/Websites/letsxchangewebsite/listings/'+ itemid +'/0.png'

    let text =
    `
    <html>
	<style>
	/* ==== UPPER HEADER ==== */
div#upper-header {
    height: 64px;  
    min-width: 1100px;
    background-color: #232f3e;
    text-align: center;
    padding: 0px;
    display: block;
    width: 100%;
}
div#upper-header:focus {
    outline: none;
}

div#header-middle-wrapper {
    display: inline-block;
    width: calc(100% - 860px);
    padding: 0;
}
div#upper-header img.logo {
    margin: 0 auto;
}

div#header-left-wrapper {
    padding-left: 0;
    padding-right: 0; 
    height: 64px;
    width: 400px;

    float: left;

    text-align: right;
}

div#header-right-wrapper {
    padding-right: 0;
    padding-left: 0;
    height: 64px;
    width: 400px;

    float: right;
}
#header-right-wrapper #logged-as,
#header-left-wrapper #motto-wrapper {
    display: inline-block;
    height: 40px;
    width: 300px;
    margin-top: 10px;
}
#header-left-wrapper #motto-wrapper {
    text-align: center;
}
#header-right-wrapper #logged-as:before,
#header-right-wrapper #logged-as_before
#header-left-wrapper #motto-wrapper:before,
#header-left-wrapper #motto-wrapper_before {
    content: "";
    display: inline-block;
    height: 100%;
    vertical-align: middle;
}
#header-right-wrapper #logged-as span,
#header-left-wrapper #motto-wrapper span {
    height: auto;
    color: white;
    vertical-align: middle;
    overflow: hidden;
}
#header-right-wrapper #logged-as span.default-cursor {
    cursor: default;
}
#header-left-wrapper #motto-wrapper span {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    float: left;
    font-size: 16px;
    
    color: #ff7707;
    cursor: default;

    position: relative;
    left: 22px;
    top: 10px;
    left: 8px;
}
#header-right-wrapper #logged-as img.avatar-small {
    vertical-align: middle;
   
}
#header-right-wrapper #logged-as img.avatar-small:hover {
    vertical-align: middle;
    height: 40px;
    width: 40px;
}
#header-right-wrapper #logged-as a[href^="/profile"] {
    text-decoration: none;
    cursor: pointer;
    display: inline-block;
    font-size: 110%;
}
#header-right-wrapper #logged-as span#username {
    display: inline-block;
    color: #ff7707;
    white-space: nowrap;
    max-width: 140px;
    overflow: auto !important;
    font-size: 110%;   
}
#header-right-wrapper #logged-as span#username::-webkit-scrollbar {
    display: none;
}
#header-right-wrapper #logged-as span#username:hover {
    font-size: 115%;
}

/* ==== START NAVIGATION BAR ==== */

nav {
    margin-bottom: 30px;
}
nav .nav_my_main{
    list-style-type: none;
    margin: 0px;
    padding: 0px;
    /*overflow: hidden;*/
    background-color: #232f3e;   
    height: 47px;
    padding-bottom: 5px;

    /* CENTERS SEARCH BAR (left and right li's are floated, so it shouldn't affect them) */
    text-align: center;
}

nav ul {
    margin: 0; /* disable default ul margin */
}

nav li {
    display: inline-block;
    padding-right: 2px;
    padding-left: 2px;
}

nav .navbar-left-wrapper {
    padding-left: 0;
    padding-right: 0; 
    /*margin-left: 80px;*/
    float: left;
    width: 400px;
}
nav .navbar-left-wrapper div.contents-nav-left {
    float: right;
}
nav .navbar-right-wrapper {
    float: right;
    padding-right: 0;
    padding-left: 0;
    /*margin-right: 80px;*/
    width: 400px;
}
nav .navbar-right-wrapper div.contents-nav-right {
    float: left;
}

nav .navbar-main-wrapper {
    /*max-width: 1460px;*/
    min-width: 1100px;
    padding: 0px;
    background-color: #232f3e;
    height: 47px;
    padding-bottom: 5px;
    display: block;
    width: 100%;
}

nav li a,
nav li button:not(.search) {
    display: block;
    color: white;
    font-size: 100%;
    /*text-align: center;*/
    padding: 14px 16px;
    text-decoration: none;
    font-family: Arial, Helvetica, sans-serif;
    border-radius: 10%;
}
nav li button {
    border: none;
    cursor: pointer;
    background-color: transparent;
}
nav li button:focus {
    outline: none;
}

nav li a:hover:not(.active),
nav li button:hover:not(.active) {
    background-color: #485769; 
}

nav li a#nav-logout:hover:not(.active),
nav li button#nav-logout:hover:not(.active) {
    background-color: rgb(221, 34, 34);
}

nav a.active,
nav button.active {
    background-color: #586a80;
}

/* ==============SEARCH BAR============== */
nav .navbar-search-wrapper li{
  width:100%;
}
nav input[type=search] {
    height: 40px;  
    font-size: 16px;
    background-color: none;
    padding: 10px 20px 10px 20px;
    /*-webkit-transition: width 0.4s ease-in-out;
    transition: width 0.4s ease-in-out;*/

    /*center element using parent text-align:center and child display:inline-block; */ 
    display: inline-block;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    box-sizing: border-box;
    background-color: #ffffff;
    box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.1);
    border:none;
    margin: 4px 0px 4px 0px;
    font-size: 14px;
    font-weight: normal;
    padding: 10px;
    width: calc(100% - 36px);

}

nav input[type=search]:focus {
    outline: none;
}
nav .navbar-search-wrapper {
    display: inline-block;
    width: calc(100% - 860px);
    padding: 0;
    /*margin: 0 auto;*/
    /*border: 2px solid red;*/
}

nav .navbar-search-wrapper button.search {
    float: right;
    padding: 10px 10px;
    margin-top: 4px;

    background: #ffa807;
    font-size: 17px;
    border: none;
    cursor: pointer;
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    height: 40px;
    width: 36px;
  }

nav .navbar-search-wrapper button.search:hover {
    background: #ff8808;
  }

/* ==============END SEARCH BAR============== */  
	
	</style>
	
	
	<head style="background-color:grey;">
		<div id="upper-header">
    <div id="header-left-wrapper">
        
    </div>
    <div id="header-middle-wrapper">
        <a href="/" id="nav-top"> <img class="logo" src="http://server.alastairserver.co.uk/Websites/letsxchangewebsite/LogoBlack.png" style="display:block;margin-left:auto;margin-right:auto;width: 40%;" alt="letsXchange"> </a>
    </div>
    <div id="motto-wrapper">
            <span>Exchanging made Fast & Easy</span>
        </div>
    <div id="header-right-wrapper">
        <div id="logged-as">
            <span class='default-cursor'></span>
        </div>
    </div>
</div>
    


	
	
	
	
	</head>
	<body>
	
	
	
	
	</body>
</html>

    
    <img src=${serverURL} style="width:40%; float:left; margin:20px;" border="2">
    <h3>User <a href="http://localhost:8080/listings/${buyer.user}"> ${buyer.user} </a> has sent you an exchange offer for your listing (${item.title})</h3>
    <h4>Message:</h4> <p>${message}</p>
    </html>
    `

    if (body.offerItem !== '' && body.offerItem !== undefined) {
        text =
        `
        <html>
        <img src="${serverURL}">
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
