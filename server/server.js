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

mongo.connect('mongodb://127.0.0.1:4000', {useUnifiedTopology: true}, (err, result) => { // Load database to main
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

app.get('/admin', (req, res) => { // All server requests not authenticating

  //
  // Verify session id
  //
  main.collection('sessions').findOne({session: req.query.session}, (err, find) => {
    if (find) {
      if (Date.now() - find.time < 30 * 60 * 1000) {
        let result = {session: find.session}
        console.log(`Session authenticated: ${find.session}`)
        //
        // Execute primary request
        //
        if (req.query.test) {
          result.requestedData = `query received from client: ${req.query.test}`
        }

        // End response
        res.send(result)
      } else {
        main.collection('sessions').deleteOne({session: req.query.session})
        res.send(false)
      }
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
    return
  }
  let pword
  try {
    pword = crypto.createHash('sha256').update(req.query.pword).digest('hex')
  } catch (e) {
    console.log('User tried to log in with invalid password')
    return
  }

  main.collection('admin-auth').findOne({uname, pword}, (err, find) => { // Attempt to find auth entry with username and password
    if (find) {
      console.log(find._id.toString()) // If found, debug testing
      const now = Date.now()
      const session = crypto.createHash('sha256').update(find._id.toString() + now).digest('hex') // Create session id based off of mongo _id and current time
      main.collection('sessions').insertOne({time: now, session})
      res.send({session}) // Insert to database sessions and return to client
    } else {
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
    return
  }
  let pword
  try {
    pword = crypto.createHash('sha256').update(req.query.pword).digest('hex')
  } catch (e) {
    console.log('User tried to update with invalid password')
    return
  }
  let token
  try {
    token = '' + req.query.token
  } catch (e) {
    console.log('User tried to update with invalid token')
  }
}

