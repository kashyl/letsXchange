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
const Jimp = require('jimp') // for image conversion

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
module.exports.runSQL = runSQL;

/**
 * Function to fetch all records of items from the database
 * based on query or without
 * After, closes the database connection and returns the data
 * @param {String} query - The searched records. The query will be searched in the record's title, category and description
 * @returns {Object} - data returned by the query
 */

async function fetchListings(query) {
    try {
        let sql = 'SELECT id, title, category, description FROM items'

        if(query !== undefined && query.q !== undefined) {
			sql = `SELECT id, title, category, description FROM books 
							WHERE upper(title) LIKE "%${ctx.query.q}%" 
							OR upper(category) LIKE upper("%${ctx.query.q}%")
							OR upper(description) LIKE upper("%${ctx.query.q}%");`
		}
        let records = await runSQL(sql)

        return records;
    } catch(err) {
        throw err
    }
}
module.exports.fetchListings = fetchListings;

/**
 * Function to open the database an fetch an item based on id
 * After, closes the database connection and returns the data
 * @param {String} itemid - The id of item whose data will be returned
 * @returns {Object} - data returned by the query
 */

async function fetchItem(itemid) {
    try {
        let sql = `SELECT * FROM items WHERE id = ${itemid};`

        let records = await runSQL(sql)

        // sanitizes the text
        records.description = records.description.replace(/(?:\r\r|\r|\n)/g, '<br>');

        return records;
    } catch(err) {
        throw err
    }
}
module.exports.fetchItem = fetchItem;


/**
 * This function takes data from an uploaded image and saves it to the `avatars` directory.
 * The file name will be the username.
 * @param {Object} files - full body info of uploaded file (ctx.request.files.___)
 * @param {String} itemid - the id of the item to find the folder with images
 * @returns {boolean} - returns true if all the images are valid and saved
 * @throws {TypeError} - throws an error if one or more of the files is not a png, jpg or jpeg image
 */
async function saveItemImages(images, itemid) {
    try {
        if (images != null) {
            // console.log(itemid)
            let imageCount = images.length

            // if only one image is uploaded, it's not an array so .length will return undefined
            // we already know from the condition above that there is at least an image, so we assign 1 to the count
            // --- SINGLE IMAGE ---
            if (imageCount == null) {
                const {path, type} = images
                const fileExtension = mime.extension(type)
    
                if(fileExtension !== 'png' && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
                    throw new Error('supported file types: png, jpg and jpeg only')
                }

                const image = await Jimp.read(path);
                // image.cover( w, h[, alignBits || mode, mode] ); 
                // scale the image to the given width and height, some parts of the image may be clipped
                // for images, .resize will make the image lose aspect ratio when height and width are not the same
                // thus, using .cover is much better as it takes the part in the middle while keeping aspect ratio, using the ALIGN_CENTER Jimp methods
                image.cover(1024, 1024, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
                    .quality(100)
                    .write(`assets/public/items/${itemid}/0.png`);

            } 
            // --- MULTIPLE IMAGES ---
            else {
                let invalidImages = 0
                // CHECK ALL FILES FORMAT
                // if one or more are not in the right format, throw an error. else continue
                for (let i = 0; i < imageCount; i++) {
                    const {type} = images[i]
                    const fileExtension = mime.extension(type)
                    // console.log(fileExtension)
                    if(fileExtension !== 'png' && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
                        invalidImages++
                    }
                }
                if (invalidImages > 0) {
                    throw new Error(`${invalidImages} image(s) out of ${imageCount} uploaded are in the wrong format. supported file types: png, jpg and jpeg only`)
                }    

                for (let i = 0; i < imageCount; i++) {
                    const {path} = images[i]
                    // console.log(`path: ${path}`)
                    // console.log(`type: ${type}`)
                    //console.log(`fileExtension: ${fileExtension}`)
        
                    const image = await Jimp.read(path);
                    // image.cover( w, h[, alignBits || mode, mode] ); 
                    // scale the image to the given width and height, some parts of the image may be clipped
                    // for images, .resize will make the image lose aspect ratio when height and width are not the same
                    // thus, using .cover is much better as it takes the part in the middle while keeping aspect ratio, using the ALIGN_CENTER Jimp methods
                    image.cover(1024, 1024, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
                        .quality(100)
                        .write(`assets/public/items/${itemid}/${i}.png`);
                }  
                return true
            }
        }
    } catch(err) {
        throw err
    }
}
module.exports.saveItemImages = saveItemImages;

/**
 * Adds item to the database
 * @param {String} userid - id of the user who adds the item
 * @param {String} item - form body (ctx.form.body) of the add item form
 * @returns {boolean} - returns true if successfully added
 * @throws {Error} - if something went wrong and item wasn't added
 */
async function addItem(userid, item) {
    try {

        // fetches date and time
        var date = new Date()

        // Build SQL command with data
        let sql = `INSERT INTO items(seller, title, description, category, location, ecategories, edescription, date)` +
                    `VALUES("${userid}", "${item.title}", "${item.description}", "${item.category}", "${item.location}"` +
                    `, "${item.exchangeCategories}", "${item.exchangeDescription}", "${date}")`

        // DATABASE COMMANDS
        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()
        return true
    } catch(err) {
        throw err
    }
}
module.exports.addItem = addItem;

/**
 * Function to fetch last id
 * @param {String} tablename - the name of the table to get the id from
 * @returns {Object} - returns an object with the id
 * @throws {Error} - if ID couldn't be found with given arguments
 */
async function lastTableId(tablename) {
    try {

        await findTable(tablename)

        let query = `SELECT seq FROM sqlite_sequence WHERE name='${tablename}';`
        let records = await runSQL(query)    
        console.log(records)

        return records
    } catch(err) {
        throw err
    }
}
module.exports.lastTableId = lastTableId;

/**
 * Function to check if user exists in the database and if passwords match
 * @param {String} username - user to search in the database
 * @param {String} password - password to check if it matches with the one in the database
 * @return {boolean} - returns true if user exists and passwords match
 * @throws {Error} - if user does not exist or password doesn't match
 */
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
 * Function to check if password of user matches
 * @param {String} username - the user of the password
 * @param {String} password - password to check with the one in the database
 * @return {boolean} - returns true if user exists and passwords match
 * @throws {Error} - if user does not exist or password doesn't match
 */
async function checkPassword(username, password) {
    try {
        const record = await runSQL(`SELECT pass FROM users WHERE user = "${username}";`)
        const valid = await bcrypt.compare(password, record.pass)
        if (valid == false) throw new Error(`invalid username or password`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.checkPassword = checkPassword;

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
 * @param {String} username - user who uploads the files
 * @param {Object} imageInfo - information of the image (from ctx.request.files.___)
 * @param {boolean} avatar - if set to true, image will be cropped and resized to fit avatar
 * @returns {boolean} - returns true if the image is valid and is saved
 * @throws {TypeError} - throws an error if the file is not a png, jpg or jpeg image
 */
async function saveAvatar(username, imageInfo, isAvatar=true) {
    try {
        if (imageInfo != null) {
            const {path, type} = imageInfo
            const fileExtension = mime.extension(type)
            console.log(`path: ${path}`)
            console.log(`type: ${type}`)
            console.log(`fileExtension: ${fileExtension}`)

            if(fileExtension !== 'png' && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
                throw new Error('supported file types: png, jpg and jpeg only')
            }
            
            // if file is not sent as avatar
            if (isAvatar !== true) {
                await fs.copy(path, `assets/public/avatars/${username}.png`)
                return true;
            }  

            const image = await Jimp.read(path);
            // image.cover( w, h[, alignBits || mode, mode] ); 
            // scale the image to the given width and height, some parts of the image may be clipped
            // for avatars, .resize will make the image lose aspect ratio when height and width are not the same
            // thus, using .cover is much better as it takes the part in the middle while keeping aspect ratio, using the ALIGN_CENTER Jimp methods
            image.cover(256, 256, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
                .quality(100)
                .write(`assets/public/avatars/${username}.png`);
                
            return true
        }
    } catch(err) {
        throw err
    }
}
module.exports.saveAvatar = saveAvatar;

/**
 * This function deletes the file with the given path with fs.unlink(path)
 * @param {String} path - the path of the file
 * @return {boolean} - returns true if image was deleted
 * @throws {Error} - if image was not deleted
 */
async function deleteFile(path) {
    try {
        fs.unlink(path, (err) => {
            if (err) {
                throw err
            }
        })
        console.log(`File deleted. Path: (${path})`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.deleteFile = deleteFile;

/**
 * This function takes two strings, finds a file named after the first one and renames it to the second string
 * @param {String} currentName - searches for file whose name equals this value
 * @param {String} newName - renames file to this value
 * @returns {boolean} - true if file was successfully renamed
 * @throws {Error}
 */
async function renameAvatar(currentName, newName) {
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
module.exports.renameAvatar = renameAvatar;

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
        console.log(`New user "${body.user}" registered!`)
        true
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
async function fetchUserData(username) {
    try {
        let records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`);
        if(!records.count) throw new Error(`user not found`)
        records = await runSQL(`SELECT user, email, mobile, gender, country, forename, surname FROM users WHERE user="${username}";`);
        return records
    } catch(err) {
        throw err
    }
}
module.exports.fetchUserData = fetchUserData;

/**
 * Function to fetch user id using username
 * @param {String} username - the user whose id is requested
 * @returns {Object} - returns an object with the id
 * @throws {Error} - if ID couldn't be found with given arguments
 */
async function fetchUserId(username) {
    try {
        let records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`);
        if(!records.count) throw new Error(`user not found`)

        records = await runSQL(`SELECT id FROM users WHERE user="${username}";`);

        return records
    } catch(err) {
        throw err
    }
}
module.exports.fetchUserId = fetchUserId;

/**
 * Function which checks if table exists in the database
 * @param {String} table - the table to search for
 * @returns {boolean} - returns true if table is found
 * @throws {Error} - if table is not found
 */
async function findTable(table) {
    try {
        var query = `SELECT name FROM sqlite_sequence WHERE name='${table}';`
        var records = await runSQL(query)    
        if(records == '') throw new Error(`table not found`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.findTable = findTable;

/**
 * Function to check if value exists in the database
 * @param {String} table - the table to be searched for the value
 * @param {String} field - the field of the value
 * @param {String} value - the value
 * @return {boolean} - returns true if value found
 * @throws {Error} - throws error if value is NOT found
 */
async function checkValue(table, field, value) {
    try {
        var records = await runSQL(`SELECT count(id) AS count FROM ${table} WHERE ${field}="${value}";`);
        if(!records.count) throw new Error(`checkValue: value "${value}" was not found in table "${table}" as "${field}"`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.checkValue = checkValue;

/**
 * Function to delete record from database
 * @param {String} table - which table to delete the record from
 * @param {String} id - the id of the record to delete
 * @returns {boolean} - returns true if user successfully deleted 
 * @throws {Error}
 */
async function deleteRecord(table, id) {
    try {
        // check if table exists
        await findTable(table)
        // check if id exists in the table
        await checkValue(table, 'id', id)
        
        // delete record from database
        let sql = (`DELETE FROM ${table} WHERE id=${id}`)
        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()

        console.log(`deleteRecord(accounts.js): Deleted record with id "${id}" from table "${table}"`)
        return true
    } catch(err) {
        throw err
    }
}
module.exports.deleteRecord = deleteRecord;

