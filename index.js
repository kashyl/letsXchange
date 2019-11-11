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
const Database = require('sqlite-async')
// const handlebars = require('koa-hbs-renderer')
// const jimp = require('jimp)

/* CUSTOM MODULES */
const accounts = require('./modules/accounts')

const app = new Koa()
const router = new Router()

app.use(staticDir('.'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}`, { extension: 'handlebars' }, { map: { handlebars: 'handlebars' } }))

const port = 8080
const dbName = 'listings.db'

router.get('/', async ctx => ctx.render('pages/index'))
router.get('/login', async ctx => ctx.render('pages/login'))
//router.get('/register', async ctx => ctx.render('pages/register'))
//router.get('/profile', async ctx => ctx.render('pages/profile'))
router.get('/contact', async ctx => ctx.render('pages/contact'))
router.get('/listing', async ctx => ctx.render('pages/listing'))
router.get('/about', async ctx => ctx.render('pages/about'))

router.get('/profile', async ctx => {
    try {
        if (ctx.session.authorised !== true) return ctx.redirect('pages/login')
        const data = {}
        if (ctx.query.msg) data.msg = ctx.query.msg
        await ctx.render('index')
    } catch(err) {
        await ctx.render('./pages/error.handlebars', {message: err.message})
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
    data.countries = ['UK', 'Europe', 'World']
    await ctx.render('./pages/register.handlebars', data)
})

app.use(router.routes())
module.exports = app.listen(port, () => console.log(`listening on port ${port}`))
