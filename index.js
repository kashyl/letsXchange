#!/usr/bin/env node
/* eslint-disable */

'use strict'

const Koa = require('koa')
const hbs = require('koa-hbs')
const Router = require('koa-router')
const views = require('koa-views')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({multipart: true, uploadDir: '.'})
const session = require('koa-session')
const sqlite = require('sqlite-async')
const bcrypt = require('bcrypt-promise')
const fs = require('fs-extra') // for files. 'fs-extra' adds more methods = no more need for 'fs'
const mime = require('mime-types')
const nodemailer = require('nodemailer');
const Jimp = require('jimp') // for image conversion
const handlebars = require('handlebars')

/* How to env variable: env.parsed.'env variable name */
const env = require('dotenv').config();

/* CUSTOM MODULES */
const accounts = require('./modules/accounts')
const email = require('./modules/email.js')

const app = new Koa()
const router = new Router()

/* Register HBS Partials for Header, HeaderAuth and Footer */
handlebars.registerPartial(
    'headerAuth',
    fs.readFileSync(__dirname + "\\views\\partials\\header-auth.handlebars", 'utf8')
)
handlebars.registerPartial(
    'header',
    fs.readFileSync(__dirname + "\\views\\partials\\header.handlebars", 'utf8')
)
handlebars.registerPartial(
    'footer',
    fs.readFileSync(__dirname + "\\views\\partials\\footer.handlebars", 'utf8')
)

/* MIDDLEWARE CONFIGURATION */
app.keys = [env.parsed.APP_KEYS]
app.use(staticDir('.'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}`, { extension: 'handlebars' }, { map: { handlebars: 'handlebars' } }))  

const port = 8080

// For BCrypt - password hashing (encryption) function
const saltRounds = 10 

/**
 * The home page with listings
 * 
 * @name Home Page
 * @route {GET} /
 */
router.get('/', async ctx => {
    try {
        const data = {}
        if (ctx.query.msg) data.msg = ctx.query.msg
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.session.user != null) { data.user = ctx.session.user }
        await ctx.render('./views/index', data)
    } catch(err) {
        await ctx.render('./views/error', {message: err.message})
    }
})

/**
 * The website contact page
 * 
 * @name Contact Page
 * @route {GET} /contact
 */
router.get('/contact', async ctx => {
    try {
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg
        if (ctx.session.user != null) { data.user = ctx.session.user }
        await ctx.render('./views/contact', data)
    } catch(err) {
        await ctx.render('./views/error', {message: err.message})
    }
})

/**
 * The website about page with misc. info
 * 
 * @name About Page
 * @route {GET} /about
 */
router.get('/about', async ctx => {
    try {
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        await ctx.render('views/about', data)
    } catch(err) {
        await ctx.render('./views/error', {message: err.message})
    }
})

/**
 * The user profile page
 * 
 * @name Profile Page
 * @route {GET} /profile
 */
router.get('/profile', async ctx => {
    try {
        if (ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')   
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg;
        if (ctx.session.user != null) data.user = ctx.session.user;

        // USER DATA
        if (ctx.session.user != null) { data.userData = ctx.session.userData }
        else {console.log("Couldn't fetch user data! (index.js, router.get('/profile', ...)")}
        
        await ctx.render('./views/profile', data)
    } catch(err) {
        await ctx.render('./views/error', {message: err.message})
    }
})

/**
 * The user registration page
 * 
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => {
    try {
        if (ctx.session.authorised === true) return ctx.redirect('/profile?msg=you are already logged in your account') 
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg
        await ctx.render('./views/register', data)
    } catch(err) {
        ctx.redirect(`/?msg=${err.message}`)
    }
})

/**
 * Script to process new user registration
 * 
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', koaBody, async ctx => {
    try {

        const body = ctx.request.body

        // Accounts.js exported function
        await accounts.addUser(body, saltRounds)

        // Redirect user to login page
        ctx.redirect(`/login?msg=account created, you can now log in`)
    } catch(err) {
        await ctx.redirect(`/register?msg=${err.message}`)
    }
})

/**
 * The item add form to make a new offer
 * 
 * @name Additem Page
 * @route {GET} /additem
 */
router.get('/additem', async ctx => {
    try {
        const data = {}
        data.auth = false

        if (ctx.session.authorised === true) { data.auth = true }
        //if user is not logged in, redirects and prompts him to sign in
        else { return ctx.redirect(`/login?msg=log in to make an offer`) }

        data.user = ctx.session.user
        data.name = ctx.session.userData.forename

        if (ctx.query.msg) data.msg = ctx.query.msg

        data.placesApiKey = [env.parsed.PLACES_API_KEY]

        await ctx.render('./views/additem', data)
    } catch(err) {
        await ctx.render('./views/error', {message: err.message})
}
})
/**
 * Script to process new item add
 * 
 * @name AddItem Script
 * @route {POST} /add-item
 */
router.post('/add-item', koaBody, async ctx => { 
    try {
        const body = ctx.request.body
        const user = {}
        user.name = ctx.session.user

        const useridobj = ctx.session.userid

        user.id = useridobj.id

        console.log(user.name)
        console.log(user.id)
        const images = ctx.request.files.images
        console.log(images)

        console.log(body)

        await accounts.addItem(user.id, body)

        return ctx.redirect(`/?msg=new offer listed`)
    } catch(err) {
        console.log(err)
        return ctx.redirect(`/additem?msg=${err.message}`)
    }
})

/**
 * The user login form page
 * 
 * @name Login Page
 * @route {GET} /login
 */
router.get('/login', async ctx => {
    try {
        if (ctx.session.authorised === true) return ctx.redirect('/profile?msg=you are already logged in') 
        const data = {}
        data.userData = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg

        await ctx.render('./views/login', data)
    } catch(err) {
        await ctx.render('./views/error', {message: err.message})
}
})

/**
 * Script to process user login
 * 
 * @name Login Script
 * @route {POST} /login
 */
 router.post('/login', async ctx => { 
 	try {
        const body = ctx.request.body
 		await accounts.checkCredentials(body.user, body.pass)
        ctx.session.authorised = true

        // ADD USERNAME TO ctx.session.user so that we keep track of which user is logged in (Need to check if there are better options)
        ctx.session.user = body.user 

        // ADD USER ID to ctx.session.id
        ctx.session.userid = await accounts.fetchUserId(ctx.session.user)
        
        // FETCH USER INFO FROM DATABASE AND PUT THE DATA IN SESSION
        let userData = await accounts.fetchUserData(body.user)
        ctx.session.userData = userData
        // console.log(ctx.session.userData)

        console.log('User ' + body.user + ' logged in')
 		return ctx.redirect(`/profile`)
 	} catch(err) {
        ctx.session.authorised = false // also prevents user from getting "double"-redirected from login page because auth is true
 		return ctx.redirect(`/login?msg=${err.message}`)
 	}   
 })

 /**
 * The user logout event (button)
 * 
 * @name Logout event
 * @route {GET} /logout
 */
router.get('/logout', async ctx => {
    console.log('User ' + ctx.session.user + ' logged out');
    ctx.session.authorised = null;
    ctx.redirect('/')
}) 

/**
 * For to send a message to website support
 * 
 * @name Contact Page
 * @route {POST} /contact-us
 */
router.post('/contact-us', async ctx => {
    try {
        const body = ctx.request.body
        await email.contactUs(body.name, body.email, body.message)
        const msg = ', thank you for contacting us, we will try to get back to you shortly!'
        return ctx.redirect(`/contact?msg=` + body.name + msg)
    } catch(err) {
        return ctx.redirect(`/contact?errmsg=${err.message}`)
    }
})

// --------------- PROFILE UPDATE FORMS ---------------

// ------ AVATAR ------ (notice there is koaBody too)
/**
 * Script to process user avatar update
 * 
 * @name EditAvatar Script
 * @route {POST} /edit-avatar
 */
router.post('/edit-avatar', koaBody, async ctx => {
    try {
        const user = ctx.session.user
        const avatar = ctx.request.files.avatar
        // console.log(avatar)
        await accounts.saveAvatar(user, avatar)

        return ctx.redirect('/profile?msg=avatar uploaded')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ USERNAME ------
/**
 * Script to process username update
 * 
 * @name EditUsername Script
 * @route {POST} /edit-username
 */
router.post('/edit-username', async ctx => {
    try {
        const body = ctx.request.body
        const currentUsername = ctx.session.user
        const newUsername = body.name

        // accounts.js function to change username
        await accounts.updateField(currentUsername, 'user', newUsername, 'unique')
        
        // update session username with the new username
        ctx.session.user = newUsername
        ctx.session.userData.user = newUsername

        // updated avatar name
        await accounts.renameAvatar(currentUsername, newUsername)

        return ctx.redirect('/profile?msg=username updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ EMAIL ------
/**
 * Script to process user email update
 * 
 * @name EditEmail Script
 * @route {POST} /edit-email
 */
router.post('/edit-email', async ctx => {
    try {
        const body = ctx.request.body
        const username = ctx.session.user
        const newEmail = body.email

        await accounts.updateField(username, 'email', newEmail, 'unique')
        
        ctx.session.userData.email = newEmail

        return ctx.redirect('/profile?msg=email updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ REAL NAME ------
/**
 * Script to process user real name update
 * 
 * @name EditRealname Script
 * @route {POST} /edit-realname
 */
router.post('/edit-realname', async ctx => {
    try {
        const body = ctx.request.body
        const username = ctx.session.user

        await accounts.updateField(username, 'forename', body.forename)
        await accounts.updateField(username, 'surname', body.surname)
        
        ctx.session.userData.forename = body.forename
        ctx.session.userData.surname = body.surname

        return ctx.redirect('/profile?msg=name updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ COUNTRY ------
/**
 * Script to process user location update
 * 
 * @name EditCountry Script
 * @route {POST} /edit-country
 */
router.post('/edit-country', async ctx => {
    try {
        const body = ctx.request.body
        const username = ctx.session.user
        
        await accounts.updateField(username, 'country', body.countries)

        ctx.session.userData.country = body.countries

        return ctx.redirect('/profile?msg=country updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ MOBILE ------
/**
 * Script to process user mobile number update
 * 
 * @name EditMobile Script
 * @route {POST} /edit-mobile
 */
router.post('/edit-mobile', async ctx => {
    try {
        const body = ctx.request.body
        const username = ctx.session.user
        
        await accounts.updateField(username, 'mobile', body.mobile)

        ctx.session.userData.mobile = body.mobile

        return ctx.redirect('/profile?msg=contact number updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ GENDER ------
/**
 * Script to process user gender update
 * 
 * @name EditGender Script
 * @route {POST} /edit-gender
 */
router.post('/edit-gender', async ctx => {
    try {
        const body = ctx.request.body
        const username = ctx.session.user
        
        await accounts.updateField(username, 'gender', body.gender)

        ctx.session.userData.gender = body.gender

        return ctx.redirect('/profile?msg=profile updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ PASSWORD ------
/**
 * Script to process user password change
 * 
 * @name EditPass Script
 * @route {POST} /edit-pass
 */
router.post('/edit-pass', async ctx => {
    try {
        const body = ctx.request.body
        const username = ctx.session.user

        // checks if "Current password" is correct
        await accounts.checkCredentials(username, body.pass)

        // encrypts password
        body.passNew = await bcrypt.hash(body.passNew, saltRounds)

        await accounts.updateField(username, 'pass', body.passNew)

        return ctx.redirect('/profile?msg=password updated')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})
// ------ PASSWORD ------
/**
 * Script to process account deletion
 * 
 * @name DeleteAccount Script
 * @route {POST} /delete-user
 */
router.post('/delete-user', async ctx => {
    try {
        const body = ctx.request.body
        // check if user field matches
        if (body.username !== ctx.session.user) {
            return ctx.redirect('/profile?msg=invalid username or password')
        }

        // check if password is valid
        await accounts.checkPassword(body.username, body.pass)

        // fetches the user id from the database using username
        const records = await accounts.fetchUserId(body.username)
        const userid = records.id

        // deletes user avatar file
        const path = `assets/public/avatars/${body.username}.png`
        await accounts.deleteFile(path)

        // deletes user record with specified id
        await accounts.deleteRecord('users', userid)

        // unauthorises session
        ctx.session.authorised = null;
        ctx.redirect('/')
    } catch(err) {
        return ctx.redirect(`/profile?msg=${err.message}`)
    }
})


// ============= LISTENER ============= 
app.use(router.routes())
module.exports = app.listen(port, async() => {
    // make sure the database has correct schema
    const db = await sqlite.open('./database/database.db')
    await db.run('CREATE TABLE IF NOT EXISTS users (' +
        'id	INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'user	TEXT,' +
        'pass	TEXT,' +
        'email	TEXT,' +
        'mobile	TEXT,' +
        'gender	TEXT,' +
        'country	TEXT,' +
        'forename	TEXT,' +
        'surname	TEXT);')
    await db.close()
    console.log(`listening on port ${port}`)
}) 
