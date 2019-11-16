#!/usr/bin/env node
/* eslint-disable */

/**
 * Accounts module
 * @module modules/accounts
 */

'use strict'

var sqlite = require('sqlite-async');
let bcrypt = require('bcrypt-promise');
const fs = require('fs-extra') // for files. 'fs-extra' adds more methods = no more need for 'fs'
const mime = require('mime-types')

/**
 * Function to open the database then execute a query
 * After, closes the database connection and returns the data
 * @param {String} query - The SQL statement to execute
 * @returns {Object} - data returned by the query
 */

async function runSQL(query) {
    try {
        console.log(query)
        let DBName = "./database/database.db";
        const db = await sqlite.open(DBName);
        const data = await db.all(query);
        await db.close();
        if(data.length === 1) return data[0]
        return data;
    } catch(err) {
        throw err
    }
}
async function checkCredentials(username, password) {
    try {
        var records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`);
        if(!records.count) throw new Error(`invalid username or password`)
        const record = await runSQL(`SELECT pass FROM users WHERE user = "${username}";`)
        const valid = await bcrypt.compare(password, record.pass)
        if (valid == false) throw new Error(`invalid username or password`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.checkCredentials = checkCredentials;

/**
 * The following function checks the database to see if a username already exists in the database.
 * If it detects a duplicate it throws an exception.
 * @param {String} username
 * @returns {boolean}
 * @throws {Error}
 */
async function checkNoDuplicateUsername(username) {
    try {
        var records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`);
        if (records.count) throw new Error(`username already exists`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.checkNoDuplicateUsername = checkNoDuplicateUsername;

/**
 * This function takes data from an uploaded image and saves it to the `avatars` directory.
 * The file name will be the username.
 * @param {String} path - location of uploaded image
 * @param {String} mimeType - mime type of uploaded file
 * @returns {boolean} - returns true if the image is valid and is saved
 * @throws {TypeError} - throws an error if the file is not a png of jpg image
 */
async function saveImage(username, avatar) {
    try {
        if (avatar != null) {
            const {path, type} = avatar
            const fileExtension = mime.extension(type)
            console.log(`path: ${path}`)
            console.log(`type: ${type}`)
            console.log(`fileExtension: ${fileExtension}`)
            await fs.copy(path, `assets/public/avatars/${username}.png`)
        }
    } catch(err) {
        throw err
    }
}
module.exports.saveImage = saveImage;

/**
 * Function to add new users to the database
 * @param {String} username - the username to add
 * @param {String} password - the password to add
 * @returns {boolean} - returns true if the username does not exist
 * @throws {Error} - throws an error if the new user account has already been created
 */
async function addUser(body, avatar, saltRounds) {
    try {
        await checkNoDuplicateUsername(body.user)

        // Processing file
        await saveImage(body.user, avatar)

        // ENCRYPT PASSWORD, BUILD SQL
        body.pass = await bcrypt.hash(body.pass, saltRounds)
        let sql = `INSERT INTO users(user, pass, email, mobile) VALUES("${body.user}", "${body.pass}", "${body.email}", "${body.mobile}")`
        console.log(sql)
        // DATABASE COMMANDS
        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()
    } catch(err) {
        throw err
    }
}
module.exports.addUser = addUser;

/**
 * Function to fetch data from users table
 * @param {String} username - the name of the user
 * @returns {Object} - returns an object with all the data
 * @throws {Error}
 */
async function fetchData(username) {
    try {
        let records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`);
        if(!records.count) throw new Error(`user not found`)
        records = await runSQL(`SELECT user, email, mobile, gender, country, forename, surname FROM users WHERE user="${username}";`);
        return records
    } catch(err) {
        throw err
    }
}
module.exports.fetchData = fetchData;