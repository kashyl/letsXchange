#!/usr/bin/env 

//This is a test

'use strict'

const Koa = require('koa')
const app = new Koa()

const port = 8080

app.use(async ctx => ctx.body = 'letsXchange')

module.exports = app.listen(port, () => console.log(`listening on port ${port}`))