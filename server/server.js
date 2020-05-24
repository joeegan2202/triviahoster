const express = require('express')
const mongo = require('mongodb')
const crypto = require('crypto')
const cors = require('cors')
const app = express()
app.use(cors())
const port = 3500

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

  app.listen(port, () => console.log('Started server...'))
})

app.get('/', (req, res) => {
  res.send('Response')
})
