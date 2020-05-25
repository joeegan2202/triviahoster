const express = require('express')
const mongo = require('mongodb')
const cors = require('cors')
const https = require('https')
const fs = require('fs')

const admin = require('./admin')
const games = require('./games')
const utils = require('./utils')

const app = express()
app.use(cors())
app.use(express.json())
const port = 3500

const privateKey = fs.readFileSync('/etc/letsencrypt/live/trivia.eganshub.net/privkey.pem', 'utf8')
const certificate = fs.readFileSync('/etc/letsencrypt/live/trivia.eganshub.net/cert.pem', 'utf8')
const ca = fs.readFileSync('/etc/letsencrypt/live/trivia.eganshub.net/chain.pem', 'utf8')

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
}

mongo.connect('mongodb://127.0.0.1:4000', { useUnifiedTopology: true }, (err, result) => { // Load database to main
  if (err) {
    console.log(`Mongo could not connect: ${err}`)
    return
  }

  utils.main = result.db('main')
  utils.main.collection('sessions').deleteMany({}) // Automatically delete all sessions if server restarts
  setInterval(() => {
    utils.main.collection('sessions').find({}).toArray((err, find) => {
      if (err) return

      for (let session of find) {
        if (Date.now() - session.time > 30 * 60 * 1000) {
          utils.main.collection('sessions').deleteOne(session)
        }
      }
    })
  }, 1000)

  https.createServer(credentials, app).listen(port, () => console.log('Server listening'))
})

app.get('/admin/games/create', games.create)

app.get('/admin/games/delete', games.deleteGame)

app.get('/admin/games/get', games.get)

app.get('/admin/auth', admin.auth)

app.get('/admin/auth/update', admin.authUpdate)
