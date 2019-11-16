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
const jimp = require('jimp') // for image conversion

/**
 * Function to open the database then execute a query
 * After, closes the database connection and returns the data
 * @param {String} query - The SQL statement to execute
 * @returns {Object} - data returned by the query
 */

async function runSQL(query) {
    try {
        //console.log(query)
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
 * The following function checks the field of the database to see if a value already exists.
 * If it detects a duplicate it throws an exception.
 * @param {String} fieldName - the field in which to search the value
 * @param {String} searchValue - the searched value
 * @returns {boolean}
 * @throws {Error}
 */
async function checkNoDuplicate(fieldName, searchValue) {
    try {
        var records = await runSQL(`SELECT count(id) AS count FROM users WHERE ${fieldName}="${searchValue}";`);
        if (records.count) throw new Error(`${fieldName} already exists`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.checkNoDuplicate = checkNoDuplicate;

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
            return true
        }
    } catch(err) {
        throw err
    }
}
module.exports.saveImage = saveImage;

/**
 * This function takes two strings, finds a file named after the first one and renames it to the second string
 * @param {String} currentName - searches for file whose name equals this value
 * @param {String} newName - renames file to this value
 * @returns {boolean} - true if file was successfully renamed
 * @throws {Error}
 */
async function renameImage(currentName, newName) {
    try {
        // check if file exists with fs.access
        fs.access(`./assets/public/avatars/${currentName}.png`, fs.F_OK, (err) => {
            if (err) {
                //console.log('fs.access AVATAR NOT FOUND (most likely)' + err)
                return
            }
            // if file exists, rename it
            fs.rename(`./assets/public/avatars/${currentName}.png`,
            `./assets/public/avatars/${newName}.png`, 
            function(err) {
                if (err) console.log('Rename avatar ERROR: ' + err)
            });
        })

        return true
    } catch(err) {
        throw err
    }
}
module.exports.renameImage = renameImage;

/**
 * Function to add new users to the database
 * @param {String} username - the username to add
 * @param {String} password - the password to add
 * @returns {boolean} - returns true if the user successfully registered
 * @throws {Error} - throws an error if the new user account has already been created
 */
async function addUser(body, saltRounds) {
    try {
        await checkNoDuplicate('user', body.user)

        // ENCRYPT PASSWORD, BUILD SQL
        body.pass = await bcrypt.hash(body.pass, saltRounds)
        let sql = `INSERT INTO users(user, pass, email, mobile) VALUES("${body.user}", "${body.pass}", "${body.email}", "${body.mobile}")`
        // console.log(sql)

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
 * Username change function
 * @param {String} username - the current username
 * @param {String} newUsername - the new username which replaces the current
 * @returns {boolean} - returns true if change was successful
 * @throws {Error} 
 */
async function changeUsername(username, newUsername) {
    try {
        // Check if desired username is already taken
        await checkNoDuplicate('user', newUsername)

        let sql = `UPDATE users SET user = "${newUsername}" WHERE user="${username}";`

        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()
        return true
    } catch(err) {
        throw err
    }
}
module.exports.changeUsername = changeUsername;

/**
 * Database field update function
 * @param {String} username - (user)name of user who wants to update profile
 * @param {String} field - what attribute of the user table to update
 * @param {String} newData - the new data which will update the chosen field
 * @param {String} unique - if unique is set, function will throw an error if value already exists in the database
 * @returns {boolean} - returns true if update was successful
 * @throws {Error} - If value already exists in the database, throws an error
 */
async function updateField(username, field, newValue, unique='no') {
    try {

        if (unique !== 'no') {
            // NO DUPLICATES - check to see if value already exists in table
            await checkNoDuplicate(field, newValue)
        }

        let sql = `UPDATE users SET ${field} = "${newValue}" WHERE user="${username}";`

        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()
        return true
    } catch(err) {
        throw err
    }
}
module.exports.updateField = updateField;

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