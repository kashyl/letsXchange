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
const fs = require('fs-extra')
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
        if (ctx.query.msg) data.msg = ctx.query.msg
        await ctx.render('./pages/contact', data)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
}
})
router.get('/listing', async ctx => ctx.render('pages/listing'))
router.get('/about', async ctx => ctx.render('pages/about'))

router.get('/profile', async ctx => {
    try {
        if (ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')   
        const data = {}
        if (ctx.query.msg) data.msg = ctx.query.msg
        if (ctx.query.user) data.user = ctx.query.user
        data.countries = ['UK', 'Europe', 'Other']
        //if (!ctx.session.isNew) console.log('User logged in'); means user is logged in
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
    const data = {}
    if (ctx.query.msg) data.msg = ctx.query.msg
    data.countries = ['UK', 'Europe', 'Other']
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
        console.log(body)
        // Processing file
        /*const {path, type} = ctx.request.files.avatar
        const fileExtension = mime.extension(type)
        console.log(`path: ${path}`)
        console.log(`type: ${type}`)
        console.log(`fileExtension: ${fileExtension}`)
        await fs.copy(path, `assets/public/avatars/${body.user}.png`)*/
        // ENCRYPT PASSWORD, BUILD SQL
        body.pass = await bcrypt.hash(body.pass, saltRounds)
        let sql = `INSERT INTO users(user, pass, email, mobile) VALUES("${body.user}", "${body.pass}", "${body.email}", "${body.mobile}")`
        console.log(sql)
        // DATABASE COMMANDS
        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()

        // Redirect user to home page
        ctx.redirect(`/?msg=new user "${body.user}" added`)
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
    }
})

router.get('/login', async ctx => {
    try {
        const data = {}
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
 		return ctx.redirect(`/profile?user=${body.user}`)
 	} catch(err) {
 		return ctx.redirect(`/login?user=${body.user}&msg=${err.message}`)
 	}
 })

router.get('/logout', async ctx => {
    ctx.session.authorised = null;
    ctx.redirect('/')
}) 

router.post('/contact-us', async ctx => {
    try {
        const body = ctx.request.body
        email.contactUs(body.name, body.email, body.message)
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
    await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT);')
    await db.close()
    console.log(`listening on port ${port}`)
}) 
