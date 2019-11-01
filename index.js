#!/usr/bin/env node

'use strict'

const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()
const router = new Router()
const views = require('koa-views')
const port = 8080

app.use(require('koa-static')('.'))

app.use(views(`${__dirname}`, { extension: 'html' }, { map: { handlebars: 'handlebars' } }))

router.get('/', async ctx => ctx.render('pages/index'))
router.get('/login', async ctx => ctx.render('pages/login'))
router.get('/register', async ctx => ctx.render('pages/register'))
router.get('/profile', async ctx => ctx.render('pages/profile'))
router.get('/contact', async ctx => ctx.render('pages/contact'))
router.get('/listing', async ctx => ctx.render('pages/listing'))
router.get('/about', async ctx => ctx.render('pages/about'))

app.use(router.routes())
module.exports = app.listen(port, () => console.log(`listening on port ${port}`))
