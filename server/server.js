const express = require('express')
const mongo = require('mongodb')
const cors = require('cors')
const https = require('https')
const fs = require('fs')

const admin = require('./admin')
const games = require('./games')
const GameState = require('./gamestate')

let state = new GameState.GameState()

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

global.main = {}

mongo.connect('mongodb://127.0.0.1:4000', { useUnifiedTopology: true }, (err, result) => { // Load database to main
    if (err) {
        console.log(`Mongo could not connect: ${err}`)
        return
    }

    global.main = result.db('main')
    global.main.collection('sessions').deleteMany({}) // Automatically delete all sessions if server restarts
    setInterval(() => {
        global.main.collection('sessions').find({}).toArray((err, find) => {
            if (err) return

            for (let session of find) {
                if (Date.now() - session.time > 30 * 60 * 1000) {
                    global.main.collection('sessions').deleteOne(session)
                }
            }
        })
    }, 1000)

    https.createServer(credentials, app).listen(port, () => console.log('Server listening'))
})

app.get('/play/state', GameState.playerAccess.bind({ execute: state.getPlayerState.bind(state) }))

app.post('/play/join', GameState.playerAccess.bind({ execute: state.join.bind(state) }))

app.post('/play/answer', GameState.playerAccess.bind({ execute: state.answerRound.bind(state) }))

app.post('/play/admin/start', GameState.adminAccess.bind({ execute: state.startGame.bind(state) }))

app.get('/play/admin/getAll', GameState.adminAccess.bind({ execute: state.getAllState.bind(state) }))

app.get('/play/admin/score', GameState.adminAccess.bind({ execute: state.autoScore.bind(state) }))

app.post('/play/admin/score', GameState.adminAccess.bind({ execute: state.acceptScores.bind(state) }))

app.post('/play/admin/next', GameState.adminAccess.bind({ execute: state.nextQuestion.bind(state) }))

app.post('/play/admin/stop', GameState.adminAccess.bind({ execute: state.stopGame.bind(state) }))

app.post('/play/admin/present', GameState.adminAccess.bind({ execute: state.presentScores.bind(state) }))

app.post('/admin/games/create', games.create)

app.get('/admin/games/delete', games.deleteGame)

app.get('/admin/games/get', games.get)

app.get('/admin/auth', admin.auth)

app.get('/admin/auth/update', admin.authUpdate)
