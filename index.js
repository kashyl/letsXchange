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

/* How to env variable: env.parsed.'env variable name */
const env = require('dotenv').config();

/* CUSTOM MODULES */
const accounts = require('./modules/accounts')
const email = require('./modules/email.js')

const app = new Koa()
const router = new Router()

/* MIDDLEWARE CONFIGURATION */
app.keys = [env.parsed.APP_KEYS]
app.use(staticDir('.'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}`, { extension: 'handlebars' }, { map: { handlebars: 'handlebars' } }))

const port = 8080
/**
 * For BCrypt - password hashing (encryption) function
 * The higher the "salt rounds" number, the stronger the encryption
 */
const saltRounds = 10 

router.get('/', async ctx => {
    try {
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        await ctx.render('./pages/index', data)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
    }
})

router.get('/contact', async ctx => {
    try {
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg
        await ctx.render('./pages/contact', data)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
    }
})
router.get('/listing', async ctx => ctx.render('pages/listing'))
router.get('/about', async ctx => {
    try {
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        await ctx.render('pages/about', data)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
    }
})

router.get('/profile', async ctx => {
    try {
        if (ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')   
        const data = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg;
        //if (ctx.query.user) data.user = ctx.query.user
        if (ctx.session.user != null) data.user = ctx.session.user;

        // USER DATA
        if (ctx.session.userData != null) { data.userData = ctx.session.userData }
        else {console.log("Couldn't fetch user data! (index.js, router.get('/profile', ...)")}
        // READ FILE COUNTRIES.JSON ASYNCHRONOUSLY AND MOVE DATA INTO data.countries
        fs.readFile('./assets/json/countries.json', (err, rawdata) => {
            if (err) throw err;
            data.countries = JSON.parse(rawdata);
        });
        
        await ctx.render('./pages/profile', data)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
    }
})

/**
 * The user registration page
 * 
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => {
    if (ctx.session.authorised === true) return ctx.redirect('/profile?msg=you are already logged in your account') 
    const data = {}
    data.auth = false
    if (ctx.session.authorised === true) { data.auth = true }
    if (ctx.query.msg) data.msg = ctx.query.msg
    await ctx.render('./pages/register', data)
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
        const avatar = ctx.request.files.avatar

        // Accounts.js exported function
        await accounts.addUser(body, avatar, saltRounds)

        // Redirect user to login page
        ctx.redirect(`/login?msg=account created, you can now log in`)
    } catch(err) {
        await ctx.redirect(`/register?msg=${err.message}`)
    }
})

router.get('/login', async ctx => {
    try {
        if (ctx.session.authorised === true) return ctx.redirect('/profile?msg=you are already logged in') 
        const data = {}
        data.userData = {}
        data.auth = false
        if (ctx.session.authorised === true) { data.auth = true }
        if (ctx.query.msg) data.msg = ctx.query.msg
        if (ctx.query.user) data.user = ctx.query.user

        await ctx.render('./pages/login', data)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
}
})

 router.post('/login', async ctx => { 
 	const body = ctx.request.body
 	try {
 		await accounts.checkCredentials(body.user, body.pass)
        ctx.session.authorised = true

        // ADD USERNAME TO ctx.session.user so that we keep track of which user is logged in (Need to check if there are better options)
        ctx.session.user = body.user 
        
        // FETCH USER INFO FROM DATABASE AND PUT THE DATA IN SESSION
        let userData = await accounts.fetchData(body.user)
        ctx.session.userData = userData
        console.log(ctx.session.userData)

        console.log('User ' + body.user + ' logged in')
 		return ctx.redirect(`/profile`)
 	} catch(err) {
        ctx.session.authorised = false // also prevents user from getting "double"-redirected from login page because auth is true
 		return ctx.redirect(`/login?msg=${err.message}`)
 	}
 })

router.get('/logout', async ctx => {
    console.log('User ' + ctx.session.user + ' logged out');
    ctx.session.authorised = null;
    ctx.redirect('/')
}) 

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
