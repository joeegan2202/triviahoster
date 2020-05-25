const express = require('express')
const mongo = require('mongodb')
const crypto = require('crypto')
const cors = require('cors')
const https = require('https')
const fs = require('fs')
const app = express()
app.use(cors())
const port = 3500

const privateKey = fs.readFileSync('/etc/letsencrypt/live/trivia.eganshub.net/privkey.pem', 'utf8')
const certificate = fs.readFileSync('/etc/letsencrypt/live/trivia.eganshub.net/cert.pem', 'utf8')
const ca = fs.readFileSync('/etc/letsencrypt/live/trivia.eganshub.net/chain.pem', 'utf8')

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
}

var main = null

mongo.connect('mongodb://127.0.0.1:4000', { useUnifiedTopology: true }, (err, result) => { // Load database to main
  if (err) {
    console.log(`Mongo could not connect: ${err}`)
    return
  }

  main = result.db('main')
  main.collection('sessions').deleteMany({}) // Automatically delete all sessions if server restarts
  setInterval(() => {
    main.collection('sessions').find({}).toArray((err, find) => {
      if (err) return

      for (let session of find) {
        if (Date.now() - session.time > 30 * 60 * 1000) {
          main.collection('sessions').deleteOne(session)
        }
      }
    })
  }, 1000)

  https.createServer(credentials, app).listen(port, () => console.log('Server listening'))
})

function verifySessionId(session, uname, callback) {
  main.collection('sessions').findOne({ session, uname }, (err, find) => {
    if (find) {
      if (Date.now() - find.time < 30 * 60 * 1000) {
        let result = { session: find.session, uname: find.uname }
        console.log(`Session authenticated: ${find.session}`)

        callback(result)
      } else {
        main.collection('sessions').deleteOne({ session })
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

app.get('/admin', (req, res) => { // All server requests not authenticating

  //
  // Verify session id
  //
  verifySessionId(req.query.session, req.query.uname, (result) => {
    if (result) {
      //
      // Execute primary request
      //
      if (req.query.test) {
        result.requestedData = `query received from client: ${req.query.test}`
      }

      res.send(result)
    } else {
      res.send(false)
    }
  })
})

app.post('/admin/games/create', (req, res) => {
  let uname
  try {
    uname = '' + req.query.uname
  } catch (e) {
    console.log('User tried to get games with invalid username')
    res.send(false)
    return
  }
  let session
  try {
    session = '' + req.query.session
  } catch (e) {
    console.log('User tried to get games with invalid session')
    res.send(false)
    return
  }

  verifySessionId(session, uname, (result) => {
    if (result) {
      main.collection('admin-games').insertOne({ uname, created: time.now(), body: req.body }, (err, result) => {
        if (err) {
          console.log('could not insert new game')
          res.send(false)
        } else {
          res.send(true)
        }
      })
    } else {
      res.send(false)
    }
  })
})

app.get('/admin/games/get', (req, res) => {
  let uname
  try {
    uname = '' + req.query.uname
  } catch (e) {
    console.log('User tried to get games with invalid username')
    res.send(false)
    return
  }
  let session
  try {
    session = '' + req.query.session
  } catch (e) {
    console.log('User tried to get games with invalid session')
    res.send(false)
    return
  }

  verifySessionId(session, uname, (result) => {
    if (result) {
      main.collection('admin-games').find({ uname }, { uname: false }).toArray((err, result) => {
        if (err) {
          console.log('There was an error getting games: ${err}')
          res.send(false)
        } else {
          console.log(result)
          res.send(result)
        }
      })
    } else {
      res.send(false)
    }
  })
})

app.get('/admin/auth', (req, res) => { // For just authenticating
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

  main.collection('admin-auth').findOne({ uname, pword }, (err, find) => { // Attempt to find auth entry with username and password
    if (find) {
      console.log(find._id.toString()) // If found, debug testing
      const now = Date.now()
      const session = crypto.createHash('sha256').update(find._id.toString() + now).digest('hex') // Create session id based off of mongo _id and current time
      main.collection('sessions').insertOne({ time: now, session, uname })
      res.send({ session }) // Insert to database sessions and return to client
    } else {
      console.log('could not find auth pair in database: ${err}')
      res.send(false) // Otherwise, return false
    }
  })
})

app.get('/admin/auth/update', (req, res) => {
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
    main.collection('admin-auth').insertOne({ uname, pword: newPword })
    res.send(true)
  } else {
    verifySessionId(session, uname, (result) => {
      if (result) {
        main.collection('admin-auth').findOne({ uname, pword: oldPword }, (err, find) => { // Attempt to find auth entry with username and password
          if (find) {
            main.collection('admin-auth').findOneAndReplace({ uname }, { uname, newPword })
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
})

