const fs = require('fs')
const crypto = require('crypto')
const utils = require('./utils')

class GameState {
  constructor() {
    this.games = {}
    this.roomNumbers = []
    this.words = JSON.parse(fs.readFileSync('server/words.json', 'utf8').toLowerCase())
  }

  startGame(args) {
    let game = args.game
    let number
    do {
      number = Math.floor((Math.random() * 1000000))
    } while (!this.roomNumbers.includes(number))

    let answers = []
    game.body.rounds.forEach(() => answers.push({}))

    this.games[game._id] = {
      owner: game.uname,
      players: [],
      title: game.body.title,
      roomNumber: number,
      password: `${this.words[Math.floor(Math.random() * 1000)]} ${this.words[Math.floor(Math.random() * 1000)]} ${this.words[Math.floor(Math.random() * 1000)]} ${this.words[Math.floor(Math.random() * 1000)]} `,
      rounds: game.body.rounds,
      answerKey: game.body.answerKey,
      currRound: 0,
      currQuestion: 0,
      answers: answers,
      scores: answers,
      showScores: false
    }
  }

  getAllState(args) {
    return this.games[args.gid]
  }

  //TODO: Get gid automatically

  getPlayerState(args) {
    let pid = args.pid
    let game = this.games[gid]

    for (player of game.players) {
      if (player.id === pid) {
        if (showScores) {
          return game.scores
        } else {
          return {
            owner: game.owner,
            title: game.title,
            questions: game.rounds[game.currRound].slice(0, game.currQuestion + 1),
          }
        }
      }
    }

    return false
  }

  join(name, roomNumber, password) {
    for (gid in this.games) {
      if (this.games[gid].roomNumber === roomNumber) {
        if (this.games[gid].password === password.toLowerCase()) {
          let pid = { id: crypto.createHash('sha256').update(name + Date.now()).digest('hex'), name: name }
          this.games[gid].players.push(pid)
          return pid
        }
      }
    }

    return false
  }

  //TODO: Change to automatically find gid

  answerRound(pid, gid, round, answers) {
    let game = this.games[gid]
    for (player of game.players) {
      if (player.id === pid) {
        game.answers[round][pid] = answers
        return true
      }
    }

    return false
  }

  autoScore(args) {
    let gid = args.gid
    let roundStart = args.roundStart
    let roundEnd = args.roundEnd
    let game = this.games[gid]

    game.answers.slice(roundStart, roundEnd).forEach((round, num) => {
      for (pid in round) {
        let scores = round[pid].map((answer, index) => answer.toLowerCase().replace(/[^\w]/g, '') === game.answerKey[num][pid][index].toLowerCase().replace(/[^\w]/g, ''))

        return scores
      }
    })
    return false
  }

  acceptScores(args) {
    let gid = args.gid
    let roundStart = args.roundStart
    let scores = args.scores
    let game = this.games[gid]

    for (let i = 0; i < scores.length(); i++) {
      game.scores[i + roundStart] = scores[i]
    }

    return true
  }

  nextQuestion(args) {
    let game = this.games[args.gid]

    if (game.currQuestion === game.rounds[game.currRound].length() + 1) {
      game.currRound++
      game.currQuestion = 0
    } else {
      game.currQuestion++
    }

    return true
  }

  stopGame(args) {
    this.games[args.gid] = null

    return true
  }

  presentScores(args) {
    this.games[args.gid].showScores = args.show

    return true
  }
}

function adminAccess(req, res) {
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
  let gid
  try {
    gid = '' + req.query.gid
  } catch (e) {}
  let game
  try {
    game = req.query.game
  } catch (e) {}
  let roundStart
  try {
    roundStart = req.query.roundStart
  } catch (e) {}
  let roundEnd
  try {
    roundEnd = req.query.roundEnd
  } catch (e) {}
  let show
  try {
    show = req.query.show
  } catch (e) {}
  let scores
  try {
    scores = req.query.scores
  } catch (e) {}

  utils.verifySessionId(session, uname, (result) => {
    if (result) {
      res.send(this.execute({ gid, game, roundStart, roundEnd, show, scores }))
    } else {
      res.send(false)
    }
  })
}

module.exports = {
  GameState,
  adminAccess
}
