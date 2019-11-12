#!/usr/bin/env node
/* eslint-disable */

'use strict'

const Koa = require('koa')
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
// const handlebars = require('koa-hbs-renderer')
// const jimp = require('jimp)

/* CUSTOM MODULES */
const accounts = require('./modules/accounts')

const app = new Koa()
const router = new Router()

/* MIDDLEWARE CONFIGURATION */
app.keys = ['darkSecret']
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

router.get('/', async ctx => ctx.render('pages/index'))
//router.get('/login', async ctx => ctx.render('pages/login'))
//router.get('/register', async ctx => ctx.render('pages/register'))
//router.get('/profile', async ctx => ctx.render('pages/profile'))
router.get('/contact', async ctx => ctx.render('pages/contact'))
router.get('/listing', async ctx => ctx.render('pages/listing'))
router.get('/about', async ctx => ctx.render('pages/about'))

router.get('/profile', async ctx => {
    try {
        if (ctx.session.authorised !== true) return ctx.redirect('/login?msg=you need to log in')   
        const data = {}
        if (ctx.query.msg) data.msg = ctx.query.msg
        await ctx.render('./pages/profile')
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
        const {path, type} = ctx.request.files.avatar
        const fileExtension = mime.extension(type)
        console.log(`path: ${path}`)
        console.log(`type: ${type}`)
        console.log(`fileExtension: ${fileExtension}`)
        await fs.copy(path, 'assets/public/avatars/avatar.png')
        // ENCRYPT PASSWORD, BUILD SQL
        body.pass = await bcrypt.hash(body.pass, saltRounds)
        const sql = `INSERT INTO users(user, pass) VALUES("${body.user}", "${body.pass}")`
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
    try {
        const body = ctx.request.body
        const db = await sqlite.open('./database/database.db')
        // Check if the username exists
        const records = await db.get(`SELECT count(id) AS count FROM users WHERE user="${body.user}";`)
        if (!records.count) return ctx.redirect('/login?msg=invalid%20username')
        const record = await db.get(`SELECT pass FROM users WHERE user = "${body.user}";`)
        await db.close()
        // Check if the password matches
        const valid = await bcrypt.compare(body.pass, record.pass)
        if (valid == false) return ctx.redirect(`/login?user=${body.user}&msg=invalid%20password`)
        // If the username and password are VALID
        ctx.session.authorised = true // AUTHORISES SESSION
        return ctx.redirect('/?msg=you are now logged in...')
    } catch(err) {
        await ctx.render('./pages/error', {message: err.message})
    }
})
/*
 router.post('/login', async ctx => { 
 	const body = ctx.request.body
 	try {
 		await accounts.checkCredentials(body.user, body.pass)
 		ctx.session.authorised = true
 		return ctx.redirect('/?msg=you are now logged in...')
 	} catch(err) {
 		return ctx.redirect(`/login?user=${body.user}&msg=${err.message}`)
 	}
 })*/

router.get('/logout', async ctx => {
    ctx.session.authorised = null;
    ctx.redirect('/')
}) 

app.use(router.routes())
module.exports = app.listen(port, async() => {
    // make sure the database has correct schema
    const db = await sqlite.open('./database/database.db')
    await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT);')
    await db.close()
    console.log(`listening on port ${port}`)
}) 
