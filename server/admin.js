// For admin authentication
const crypto = require('crypto')
const utils = require('./utils')

module.exports = {
  auth,
  authUpdate
}

function auth(req, res) { // For just authenticating
  let uname
  try {
    uname = '' + req.query.uname
  } catch (e) {
    console.log('User tried to log in with invalid username')
    res.send(false)
    return
  }
  let pword
  try {
    pword = crypto.createHash('sha256').update(req.query.pword).digest('hex')
  } catch (e) {
    console.log('User tried to log in with invalid password')
    res.send(false)
    return
  }

  global.main.collection('admin-auth').findOne({ uname, pword }, (err, find) => { // Attempt to find auth entry with username and password
    if (find) {
      console.log(find._id.toString()) // If found, debug testing
      const now = Date.now()
      const session = crypto.createHash('sha256').update(find._id.toString() + now).digest('hex') // Create session id based off of mongo _id and current time
      global.main.collection('sessions').insertOne({ time: now, session, uname })
      res.send({ session }) // Insert to database sessions and return to client
    } else {
      console.log('could not find auth pair in database: ${err}')
      res.send(false) // Otherwise, return false
    }
  })
}

function authUpdate(req, res) {
  let uname
  try {
    uname = '' + req.query.uname
  } catch (e) {
    console.log('User tried to update with invalid username')
    res.send(false)
    return
  }
  let oldPword
  try {
    oldPword = crypto.createHash('sha256').update(req.query.oldPword).digest('hex')
  } catch (e) {
    console.log('User tried to update with invalid password')
    res.send(false)
    return
  }
  let newPword
  try {
    newPword = crypto.createHash('sha256').update(req.query.newPword).digest('hex')
  } catch (e) {
    console.log('User tried to update with invalid password')
    res.send(false)
    return
  }
  let session
  try {
    session = '' + req.query.session
  } catch (e) {
    console.log('User tried to update with invalid session')
    res.send(false)
    return
  }

  console.log(`User updating... Username: ${uname}, Old Password: ${oldPword}, New Password: ${newPword}, Token: ${session}`)

  if (session === 'new') {
    console.log('inserting new user')
    global.main.collection('admin-auth').insertOne({ uname, pword: newPword })
    res.send(true)
  } else {
    utils.verifySessionId(session, uname, (result) => {
      if (result) {
        global.main.collection('admin-auth').findOne({ uname, pword: oldPword }, (err, find) => { // Attempt to find auth entry with username and password
          if (find) {
            global.main.collection('admin-auth').findOneAndReplace({ uname }, { uname, pword: newPword })
            res.send(true)
          } else {
            console.log('User trying to update did not authenticate')
            res.send(false)
          }
        })
      } else {
        console.log('Users session did not validate')
        res.send(false)
      }
    })
  }
}
