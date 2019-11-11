#!/usr/bin/env node

'use strict'

const Koa = require('koa')
const Router = require('koa-router')
const stat = require('koa-static')
const views = require('koa-views')
const Database = require('sqlite-async')
// const handlebars = require('koa-hbs-renderer')
// const bodyParser = require('koa-bodyparser')

const app = new Koa()
const router = new Router()

app.use(stat('.'))
app.use(views(`${__dirname}`, { extension: 'html' }, { map: { handlebars: 'handlebars' } }))

const port = 8080
const dbName = 'listings.db'

router.get('/', async ctx => ctx.render('pages/index'))
router.get('/login', async ctx => ctx.render('pages/login'))
router.get('/register', async ctx => ctx.render('pages/register'))
router.get('/profile', async ctx => ctx.render('pages/profile'))
router.get('/contact', async ctx => ctx.render('pages/contact'))
router.get('/listing', async ctx => ctx.render('pages/listing'))
router.get('/about', async ctx => ctx.render('pages/about'))

app.use(router.routes())
module.exports = app.listen(port, () => console.log(`listening on port ${port}`))
