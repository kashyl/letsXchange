#!/usr/bin/env node
/* eslint-disable */

/**
 * Accounts module
 * @module modules/accounts
 */

 'use strict'

 var sqlite = require('sqlite-async');
 let bcrypt = require('bcrypt-promise');

 /**
  * Function to open the database then execute a query
  * After, closes the database connection and returns the data
  * @param {String} query - The SQL statement to execute
  * @returns {Object} - data returned by the query
  */

  async function runSQL(query) {
      try {
          console.log(query)
          let DBName = "./database/accounts.db";
          const db = await sqlite.open(DBName);
          const data = await db.all(query);
          await db.close();
          if(data.length === 1) return data[0]
          return data;
      } catch(err) {
          throw err
      }
  }

  module.exports.checkCredentials = async(username, password) => {
      try {
          var records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`);
          if(!records.count) throw new Error(`invalid username`)
          const record = await runSQL(`SELECT pass FROM users WHERE user = "${username}";`)
          const valid = await bcrypt.compare(password, record.pass)
          if (valid == false) throw new Error(`invalid password`)
          return true
      } catch(err) {
          throw err
      }
  }

/**
 * The following function checks the database to see if a username already exists in the database.
 * If it detects a duplicate it throws an exception.
 * @param {String} username
 * @returns {boolean}
 * @throws {Error}
 */
async function checkNoDuplicateUsername (username) {
    return true
}

/**
 * This function takes data from an uploaded image and saves it to the `avatars` directory.
 * The file name will be the username.
 * @param {String} path - location of uploaded image
 * @param {String} mimeType - mime type of uploaded file
 * @returns {boolean} - returns trure if the image is valid and is saved
 * @throws {TypeError} - throws an error if the file is not a png of jpg image
 */
async function saveImage(path, mimetype) {
    return true
}

/**
 * Function to add new users to the database
 * @param {String} username - the username to add
 * @param {String} password - the password to add
 * @returns {boolean} - returns true if the username does not exist
 * @throws {Error} - throws an error if the new user account has already been created
 */
module.exports.addUser = async(username, password) => {
    return true;
}