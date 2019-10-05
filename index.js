#!/usr/bin/env node

'use strict'

const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()
const router = new Router()
const views = require('koa-views')
const port = 8080

app.use(require('koa-static')('assets'))

app.use(views(`${__dirname}`, { extension: 'html' }, {map: { handlebars: 'handlebars' }}))

router.get('/', async ctx => await ctx.render('pages/index'))
router.get('/login', async ctx => await ctx.render('pages/login'))
router.get('/profile', async ctx => await ctx.render('pages/profile'))
router.get('/contact', async ctx => await ctx.render('pages/contact'))


app.use(router.routes())
module.exports = app.listen(port, () => console.log(`listening on port ${port}`))