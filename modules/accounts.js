#!/usr/bin/env node

/**
 * Accounts module
 * @module modules/accounts
 */

'use strict'

var sqlite = require('sqlite-async')
const bcrypt = require('bcrypt-promise')
const fs = require('fs-extra') // for files. 'fs-extra' adds more methods = no more need for 'fs'
const mime = require('mime-types')
const Jimp = require('jimp') // for image conversion

/**
 * Function to open the database then execute a query
 * After, closes the database connection and returns the data
 * @param {String} query - The SQL statement to execute
 * @returns {Object} - data returned by the query
 */

async function runSQL (query) {
    const DBName = './database/database.db'
    const db = await sqlite.open(DBName)
    const data = await db.all(query)
    await db.close()
    if (data.length === 1) return data[0]
    return data
}
module.exports.runSQL = runSQL

/**
 * Function to show date and time in mm/dd/yyyy at h:m:s format
 * @returns {String} - the date and time
 */
async function dateAndTime () {
    function addZero (i) {
        if (i < 10) {
            i = '0' + i
        }
        return i
    }

    let today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0') // January is 0!
    const yyyy = today.getFullYear()
    const h = addZero(today.getHours())
    const m = addZero(today.getMinutes())
    const s = addZero(today.getSeconds())
    today = mm + '/' + dd + '/' + yyyy
    today = today + ' at ' + h + ':' + m + ':' + s

    return today
}
module.exports.dateAndTime = dateAndTime

/**
 * Function to show year of date string
 * @returns {String} - the date and time
 */
async function getYear (date) {
    const month = date.split(' ')[1]
    const year = date.split(' ')[3]

    return month + ' ' + year
}
module.exports.getYear = getYear

/**
 * Function to fetch all records of items from the database
 * based on query or without
 * After, closes the database connection and returns the data
 * @param {String} query - The searched records. The query will be searched in the record's title, category and description
 * @returns {Object} - data returned by the query
 */
async function fetchListings (query) {
    // Todo: sanitize input string
    if (query === '') {
        const sql = 'SELECT id, title, category, description, location FROM items ORDER BY id DESC'
        const records = await runSQL(sql)
        return records
    } else {
        const sql = `SELECT id, title, category, description FROM items 
                    WHERE upper(title) LIKE "%${query}%" 
                    OR upper(category) LIKE upper("%${query}%")
                    OR upper(description) LIKE upper("%${query}%")
                    OR upper(location) LIKE upper("%${query}%")
                    ORDER BY id DESC;`
        let records = await runSQL(sql)

        // if only one item is returned, create an array for it
        if (records != null && records.length === undefined) {
            records = [records]
        }
        // console.log(records)

        return records
    }
}
module.exports.fetchListings = fetchListings

/**
 * Function to fetch records matching seller id and user id
 * After, closes the database connection and returns the data
 * @param {String} user - the id (or name) of the user whose listings to return
 * @param {String} mode - by id (default) or user ('id' vs 'username')
 * @returns {Object} - data returned by the query
 * @returns {boolean} - false if no listings found
 */
async function fetchUserListings (user, mode = 'id') {
    try {
        // if username is given, use it to fetch user id
        if (mode === 'username') {
            const useridObj = await fetchUserId(user)
            user = useridObj.id
        }

        // if user has no listings, return
        const records = await runSQL(`SELECT count(id) AS count FROM items WHERE seller="${user}";`)
        if (!records.count) return

        const sql = `SELECT * FROM items WHERE seller = "${user}" ORDER BY id DESC;`
        let listings = await runSQL(sql)

        // if there is only one record, add it as an array element
        if (!listings.length) {
            listings = [listings]
        }

        return listings
    } catch (err) {
        console.log(err)
        throw err
    }
}
module.exports.fetchUserListings = fetchUserListings

/**
 * Function to fetch records on the user's watchlist
 * After, closes the database connection and returns the data
 * @param {String} userid - the id of the user whose watchlist records to return
 * @returns {Object} - data returned by the query
 */
async function fetchUserWatchListings (userid) {
    const record = await runSQL(`SELECT watchlist FROM users WHERE id="${userid}";`)
    // if no items are watchlisted, return
    if (!record.watchlist) return

    // splits the string into array while removing the last element
    let watchlist = record.watchlist.split(',')

    // converts string into comma separated list readable by sql
    // ['1', '2', '3', '4'] ===> (1, 2, 3, 4)
    watchlist = '(' + watchlist.join(',') + ')'

    const sql = `SELECT * FROM items WHERE id IN ${watchlist} ORDER BY id DESC;`
    let records = await runSQL(sql)

    // if there is only one record, add it as an array element
    if (!records.length) {
        records = [records]
    }

    return records
}
module.exports.fetchUserWatchListings = fetchUserWatchListings

/**
 * Function to open the database an fetch an item based on id
 * After, closes the database connection and returns the data
 * @param {String} itemid - The id of item whose data will be returned
 * @returns {Object} - data returned by the query
 */

async function fetchItem (itemid) {
    const sql = `SELECT * FROM items WHERE id = ${itemid};`

    const records = await runSQL(sql)
    console.log(records)
    records.ecategories = records.ecategories.split(',')

    return records
}
module.exports.fetchItem = fetchItem

/**
 * Function to return the item's image files names
 * @param {String} itemid - The id of item whose image data will be returned
 * @returns {Object} - data returned by the query
 */

async function fetchItemImageInfo (itemid) {
    try {
        const path = `${__dirname}/../assets/public/items/${itemid}/`

        const list = fs.readdirSync(path) // gets file names. !!! SYNC !!!

        list.splice(list.indexOf('thumbs'), 1) // removes thumbs folder from the list

        return list
    } catch (err) {
        // console.log(err)
        // throw err
    }
}
module.exports.fetchItemImageInfo = fetchItemImageInfo
/**
 * Function to return the item's thumbnails files names
 * @param {String} itemid - The id of item whose thumbnail data will be returned
 * @returns {Object} - data returned by the query
 */

async function fetchItemThumbInfo (itemid) {
    try {
        const path = `${__dirname}/../assets/public/items/${itemid}/thumbs`

        const list = fs.readdirSync(path) // gets file names. !!! SYNC !!!

        return list
    } catch (err) {
        // console.log(err)
        // throw err
    }
}
module.exports.fetchItemThumbInfo = fetchItemThumbInfo

/**
 * This function takes data from an uploaded image and saves it to the `avatars` directory.
 * The file name will be the username.
 * @param {Object} files - full body info of uploaded file (ctx.request.files.___)
 * @param {String} itemid - the id of the item to find the folder with images
 * @returns {boolean} - returns true if all the images are valid and saved
 * @throws {TypeError} - throws an error if one or more of the files is not a png, jpg or jpeg image
 */
async function saveItemImages (images, itemid) {
    if (images != null) {
        // console.log(itemid)
        const imageCount = images.length

        // if only one image is uploaded, it's not an array so .length will return undefined
        // we already know from the condition above that there is at least an image, so we assign 1 to the count
        // --- SINGLE IMAGE ---
        if (imageCount == null) {
            const { path, type } = images
            const fileExtension = mime.extension(type)

            if (fileExtension !== 'png' && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
                throw new Error('supported file types: png, jpg and jpeg only')
            }

            const image = await Jimp.read(path)
            // FULL PICTURES
            image.contain(1280, 720)
                .quality(100)
                .write(`assets/public/items/${itemid}/0.png`)

            // THUMBNAILS
            // image.cover( w, h[, alignBits || mode, mode] );
            // scale the image to the given width and height, some parts of the image may be clipped
            // for images, .resize will make the image lose aspect ratio when height and width are not the same
            // thus, using .cover is much better as it takes the part in the middle while keeping aspect ratio, using the ALIGN_CENTER Jimp methods
            image.cover(512, 512, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
                .quality(100)
                .write(`assets/public/items/${itemid}/thumbs/0.png`)
        } else {
            // --- MULTIPLE IMAGES ---
            let invalidImages = 0
            // CHECK ALL FILES FORMAT
            // if one or more are not in the right format, throw an error. else continue
            for (let i = 0; i < imageCount; i++) {
                const { type } = images[i]
                const fileExtension = mime.extension(type)
                // console.log(fileExtension)
                if (fileExtension !== 'png' && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
                    invalidImages++
                }
            }
            if (invalidImages > 0) {
                throw new Error(`${invalidImages} image(s) out of ${imageCount} uploaded are in the wrong format. supported file types: png, jpg and jpeg only`)
            }

            for (let i = 0; i < imageCount; i++) {
                const { path } = images[i]
                const image = await Jimp.read(path)
                // FULL PICTURES
                image.contain(1280, 720)
                    .quality(100)
                    .write(`assets/public/items/${itemid}/${i}.png`)
                // THUMBNAILS
                // image.cover( w, h[, alignBits || mode, mode] );
                // scale the image to the given width and height, some parts of the image may be clipped
                // for images, .resize will make the image lose aspect ratio when height and width are not the same
                // thus, using .cover is much better as it takes the part in the middle while keeping aspect ratio, using the ALIGN_CENTER Jimp methods
                image.cover(512, 512, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
                    .quality(100)
                    .write(`assets/public/items/${itemid}/thumbs/${i}.png`)
            }
            return true
        }
    }
}
module.exports.saveItemImages = saveItemImages

/**
 * Adds item to the database
 * @param {String} userid - id of the user who adds the item
 * @param {String} item - form body (ctx.form.body) of the add item form
 * @returns {boolean} - returns true if successfully added
 * @throws {Error} - if something went wrong and item wasn't added
 */
async function addItem (userid, item) {
    const today = await dateAndTime()

    // Build SQL command with data
    const sql = 'INSERT INTO items(seller, title, description, category, location, ecategories, edescription, date)' +
                `VALUES("${userid}", "${item.title}", "${item.description}", "${item.category}", "${item.location}"` +
                `, "${item.exchangeCategories}", "${item.exchangeDescription}", "${today}")`

    // DATABASE COMMANDS
    const db = await sqlite.open('./database/database.db')
    await db.run(sql)
    await db.close()

    return true
}
module.exports.addItem = addItem

/**
 * Removes item from the database
 * @param {String} userid - id of the user who removes the item
 * @param {String} itemid - the id of the item
 * @returns {boolean} - returns true if successfully removed
 * @throws {Error} - if something went wrong and item wasn't removed, e.g. user doesn't have permission
 */
async function removeItem (userid, itemid) {
    const item = await fetchItem(itemid)
    if (userid !== parseInt(item.seller, 10)) throw new Error('Permission denied')

    await deleteRecord('items', item.id)

    console.log(`User ${userid} removed listing with id "${itemid}".`)

    return true
}
module.exports.removeItem = removeItem

/**
 * Function to fetch last id
 * @param {String} tablename - the name of the table to get the id from
 * @returns {Object} - returns an object with the id
 * @throws {Error} - if ID couldn't be found with given arguments
 */
async function lastTableId (tablename) {
    await findTable(tablename)

    const query = `SELECT seq FROM sqlite_sequence WHERE name='${tablename}';`
    const records = await runSQL(query)

    // console.log(records)

    return records
}
module.exports.lastTableId = lastTableId

/**
 * Function to check if user exists in the database and if passwords match
 * @param {String} username - user to search in the database
 * @param {String} password - password to check if it matches with the one in the database
 * @return {boolean} - returns true if user exists and passwords match
 * @throws {Error} - if user does not exist or password doesn't match
 */
async function checkCredentials (username, password) {
    var records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`)
    if (!records.count) throw new Error('invalid username or password')
    const record = await runSQL(`SELECT pass FROM users WHERE user = "${username}";`)
    const valid = await bcrypt.compare(password, record.pass)
    if (valid === false) throw new Error('invalid username or password')
    return true
}
module.exports.checkCredentials = checkCredentials

/**
 * Function to check if password of user matches
 * @param {String} username - the user of the password
 * @param {String} password - password to check with the one in the database
 * @return {boolean} - returns true if user exists and passwords match
 * @throws {Error} - if user does not exist or password doesn't match
 */
async function checkPassword (username, password) {
    const record = await runSQL(`SELECT pass FROM users WHERE user = "${username}";`)
    const valid = await bcrypt.compare(password, record.pass)
    if (valid === false) throw new Error('invalid username or password')
    return true
}
module.exports.checkPassword = checkPassword

/**
 * The following function checks the field of the database to see if a value already exists.
 * If it detects a duplicate it throws an exception.
 * @param {String} fieldName - the field in which to search the value
 * @param {String} searchValue - the searched value
 * @returns {boolean}
 * @throws {Error}
 */
async function checkNoDuplicate (fieldName, searchValue) {
    var records = await runSQL(`SELECT count(id) AS count FROM users WHERE ${fieldName}="${searchValue}";`)
    if (records.count) throw new Error(`${fieldName} already exists`)
    return true
}
module.exports.checkNoDuplicate = checkNoDuplicate

/**
 * This function takes data from an uploaded image and saves it to the `avatars` directory.
 * The file name will be the username.
 * @param {String} username - user who uploads the files
 * @param {Object} imageInfo - information of the image (from ctx.request.files.___)
 * @param {boolean} avatar - if set to true, image will be cropped and resized to fit avatar
 * @returns {boolean} - returns true if the image is valid and is saved
 * @throws {TypeError} - throws an error if the file is not a png, jpg or jpeg image
 */
async function saveAvatar (username, imageInfo, isAvatar = true) {
    if (imageInfo != null) {
        const { path, type } = imageInfo
        const fileExtension = mime.extension(type)
        console.log(`path: ${path}`)
        console.log(`type: ${type}`)
        console.log(`fileExtension: ${fileExtension}`)

        if (fileExtension !== 'png' && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
            throw new Error('supported file types: png, jpg and jpeg only')
        }

        // if file is not sent as avatar
        if (isAvatar !== true) {
            await fs.copy(path, `assets/public/avatars/${username}.png`)
            return true
        }

        const image = await Jimp.read(path)
        // image.cover( w, h[, alignBits || mode, mode] );
        // scale the image to the given width and height, some parts of the image may be clipped
        // for avatars, .resize will make the image lose aspect ratio when height and width are not the same
        // thus, using .cover is much better as it takes the part in the middle while keeping aspect ratio, using the ALIGN_CENTER Jimp methods
        image.cover(256, 256, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
            .quality(100)
            .write(`assets/public/avatars/${username}.png`)

        return true
    }
}
module.exports.saveAvatar = saveAvatar

/**
 * This function deletes the file with the given path with fs.unlink(path)
 * @param {String} path - the path of the file
 * @return {boolean} - returns true if image was deleted
 * @throws {Error} - if image was not deleted
 */
async function deleteFile (path) {
    fs.unlink(path, (err) => {
        if (err) {
            throw err
        }
    })
    console.log(`File deleted. Path: (${path})`)
    return true
}
module.exports.deleteFile = deleteFile

/**
 * This function deletes the directory with the given path
 * @param {String} path - the path of the file
 * @return {boolean} - returns true if directory was deleted, false if path was invalid
 * @throws {Error}
 */
async function deleteDirectory (path) {
    if (path === '' || path === '/') return false
    fs.remove(path, (err) => {
        if (err) {
            throw err
        }
    })
    console.log(`Directory deleted. Path: (${path})`)
    return true
}
module.exports.deleteDirectory = deleteDirectory

/**
 * This function takes two strings, finds a file named after the first one and renames it to the second string
 * @param {String} currentName - searches for file whose name equals this value
 * @param {String} newName - renames file to this value
 * @returns {boolean} - true if file was successfully renamed
 * @throws {Error}
 */
async function renameAvatar (currentName, newName) {
    // check if file exists with fs.access
    fs.access(`./assets/public/avatars/${currentName}.png`, fs.F_OK, (err) => {
        if (err) {
            // console.log('fs.access AVATAR NOT FOUND (most likely)' + err)
            return
        }
        // if file exists, rename it
        fs.rename(`./assets/public/avatars/${currentName}.png`,
            `./assets/public/avatars/${newName}.png`,
            function (err) {
                if (err) console.log('Rename avatar ERROR: ' + err)
            })
    })

    return true
}
module.exports.renameAvatar = renameAvatar

/**
 * Function to add new users to the database
 * @param {String} username - the username to add
 * @param {String} password - the password to add
 * @returns {boolean} - returns true if the user successfully registered
 * @throws {Error} - throws an error if the new user account has already been created
 */
async function addUser (body, saltRounds) {
    await checkNoDuplicate('user', body.user)

    const date = new Date()

    // ENCRYPT PASSWORD, BUILD SQL
    body.pass = await bcrypt.hash(body.pass, saltRounds)
    const sql = `INSERT INTO users(user, pass, email, mobile, registerdate) VALUES("${body.user}", "${body.pass}", "${body.email}", "${body.mobile}", "${date}")`
    // console.log(sql)

    // DATABASE COMMANDS
    const db = await sqlite.open('./database/database.db')
    await db.run(sql)
    await db.close()
    console.log(`New user "${body.user}" registered!`)
    return true
}
module.exports.addUser = addUser

/**
 * Username change function
 * @param {String} username - the current username
 * @param {String} newUsername - the new username which replaces the current
 * @returns {boolean} - returns true if change was successful
 * @throws {Error}
 */
async function changeUsername (username, newUsername) {
    // Check if desired username is already taken
    await checkNoDuplicate('user', newUsername)

    const sql = `UPDATE users SET user = "${newUsername}" WHERE user="${username}";`

    const db = await sqlite.open('./database/database.db')
    await db.run(sql)
    await db.close()
    return true
}
module.exports.changeUsername = changeUsername

/**
 * Database field update function
 * @param {String} username - (user)name of user who wants to update profile
 * @param {String} field - what attribute of the user table to update
 * @param {String} newData - the new data which will update the chosen field
 * @param {String} unique - if unique is set, function will throw an error if value already exists in the database
 * @returns {boolean} - returns true if update was successful
 * @throws {Error} - If value already exists in the database, throws an error
 */
async function updateField (username, field, newValue, unique = 'no') {
    if (unique !== 'no') {
        // NO DUPLICATES - check to see if value already exists in table
        await checkNoDuplicate(field, newValue)
    }

    const sql = `UPDATE users SET ${field} = "${newValue}" WHERE user="${username}";`

    const db = await sqlite.open('./database/database.db')
    await db.run(sql)
    await db.close()
    return true
}
module.exports.updateField = updateField

/**
 * Function to fetch data from users table
 * @param {String} searchval - the name or id, depending on the selected mode
 * @param {String} mode - by username or id, default username
 * @returns {Object} - returns an object with all the data
 * @returns {boolean} - false if invalid mode arguments
 * @throws {Error}
 */
async function fetchUserData (searchval, mode = 'username') {
    try {
        let records = []

        if (mode === 'username') {
            records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${searchval}";`)
            if (!records.count) throw new Error('user not found')
            records = await runSQL(`SELECT * FROM users WHERE user="${searchval}";`)
        } else if (mode === 'id') {
            records = await runSQL(`SELECT count(id) AS count FROM users WHERE id="${searchval}";`)
            if (!records.count) throw new Error('user not found')
            records = await runSQL(`SELECT * FROM users WHERE id="${searchval}";`)
        } else {
            console.log('fetchUserData mode unknown (invalid arguments)')
            return false
        }

        return records
    } catch (err) {
        console.log(err)
        throw err
    }
}
module.exports.fetchUserData = fetchUserData

/**
 * Function to fetch user id using username
 * @param {String} username - the user whose id is requested
 * @returns {Object} - returns an object with the id
 * @throws {Error} - if ID couldn't be found with given arguments
 */
async function fetchUserId (username) {
    let records = await runSQL(`SELECT count(id) AS count FROM users WHERE user="${username}";`)
    if (!records.count) throw new Error('user not found')

    records = await runSQL(`SELECT id FROM users WHERE user="${username}";`)

    return records
}
module.exports.fetchUserId = fetchUserId

/**
 * Function to fetch user name using id
 * @param {String} userid - the id of user whose name is requested
 * @returns {Object} - returns an object with the username
 * @throws {Error} - if ID couldn't be found with given arguments
 */
async function fetchUserName (userid) {
    let records = await runSQL(`SELECT count(id) AS count FROM users WHERE id="${userid}";`)
    if (!records.count) throw new Error('user not found')

    records = await runSQL(`SELECT user FROM users WHERE id="${userid}";`)

    return records
}
module.exports.fetchUserName = fetchUserName

/**
 * Function which checks if table exists in the database
 * @param {String} table - the table to search for
 * @returns {boolean} - returns true if table is found
 * @throws {Error} - if table is not found
 */
async function findTable (table) {
    var query = `SELECT name FROM sqlite_sequence WHERE name='${table}';`
    var records = await runSQL(query)
    if (records === '') throw new Error('table not found')
    return true
}
module.exports.findTable = findTable

/**
 * Function to check if value exists in the database
 * @param {String} table - the table to be searched for the value
 * @param {String} field - the field of the value
 * @param {String} value - the value
 * @return {boolean} - returns true if value found
 * @throws {Error} - throws error if value is NOT found
 */
async function checkValue (table, field, value) {
    var records = await runSQL(`SELECT count(id) AS count FROM ${table} WHERE ${field}="${value}";`)
    if (!records.count) throw new Error(`checkValue: value "${value}" was not found in table "${table}" as "${field}"`)
    return true
}
module.exports.checkValue = checkValue

/**
 * Function to delete record from database
 * @param {String} table - which table to delete the record from
 * @param {String} id - the id of the record to delete
 * @returns {boolean} - returns true if user successfully deleted
 * @throws {Error}
 */
async function deleteRecord (table, id) {
    // check if table exists
    await findTable(table)
    // check if id exists in the table
    await checkValue(table, 'id', id)

    // delete record from database
    const sql = (`DELETE FROM ${table} WHERE id=${id}`)
    const db = await sqlite.open('./database/database.db')
    await db.run(sql)
    await db.close()

    console.log(`deleteRecord(accounts.js): Deleted record with id "${id}" from table "${table}"`)
    return true
}
module.exports.deleteRecord = deleteRecord

/**
 * Function to check whether item is in the viewing user's watchlist
 * @param {String} userid - the id of the viewing user
 * @param {String} itemid - the id of the item
 * @returns {boolean} - true if it is, false if it isn't
 */
async function isWatchlisted (userid, itemid) {
    const record = await runSQL(`SELECT watchlist FROM users WHERE id="${userid}";`)
    if (!record.watchlist) return
    // splits the string into array while removing the last element
    const watchlist = record.watchlist.split(',')

    return watchlist.includes(itemid)
}
module.exports.isWatchlisted = isWatchlisted

/**
 * Function to update user's watchlist
 * @param {String} userid - the id of the user whose watchlist is requested
 * @param {String} itemid - the id of the item to be added to the watchlist
 * @param {String} mode - 'add' or 'remove'
 * @returns {boolean} - false if update failed, true if it was successful
 */
async function updateUserWatchlist (userid, itemid, mode) {
    const record = await runSQL(`SELECT watchlist FROM users WHERE id="${userid}";`)

    // splits the string data into array
    let watchlist = []
    if (record.watchlist) {
        watchlist = record.watchlist.split(',')
    }

    if (mode === 'add') {
        // adds the itemid to the array
        watchlist.push(itemid)
        // converts the array back to string (elements separated by commas)
        watchlist = watchlist.toString()
        // updates user watchlist in database
        const sql = `UPDATE users SET watchlist = "${watchlist}" WHERE id="${userid}";`
        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()
        return true
    }

    if (mode === 'remove') {
        // if item is not in the watchlist, logs error and returns false
        const valid = await isWatchlisted(userid, itemid)
        if (!valid) {
            console.log(`Could't update watchlist as itemid "${itemid}" wasn't found in user "${userid}" 's watchlist.`)
            return false
        }
        // removes the itemid from the watchlist array
        const index = watchlist.indexOf(itemid)
        if (index > -1) {
            watchlist.splice(index, 1)
        }
        // converts the array back to string (elements separated by commas)
        watchlist = watchlist.toString()
        // updates user watchlist in database
        const sql = `UPDATE users SET watchlist = "${watchlist}" WHERE id="${userid}";`
        const db = await sqlite.open('./database/database.db')
        await db.run(sql)
        await db.close()
        return true
    }

    console.log('Wrong mode argument given for updateUserWatchlist function')
    return false
}
module.exports.updateUserWatchlist = updateUserWatchlist
