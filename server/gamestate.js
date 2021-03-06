const fs = require('fs')
const crypto = require('crypto')
const utils = require('./utils')

class GameState {
  constructor() {
    this.games = {}
    this.roomNumbers = []
    this.words = JSON.parse(fs.readFileSync('server/words.json', 'utf8'))
  }

  // Start Game method:
  // args:
  // game: {
  // uname: "Joe Smith",
  // title: "Some Test Trivia Game",
  // body: { //This is the meat and potatoes of the game object. It contains info about the questions and answers
  //  rounds: [
  //    [{text: "Joe Egan is which gender?", img: "<<url-here>>"}, ... ], //Round 1
  //    [{text: "Joe Egan is which age?", img: "<<url-here>>"}, ... ] //Round 2
  //  ],
  //  answerKey: [
  //    ["Male", ... ], //Round 1
  //    ["17", ... ] //Round 2
  //  ]
  // }
  // }
  startGame(args) {
    let game = args.game
    let number
    do {
      number = Math.floor((Math.random() * 1000000))
    } while (this.roomNumbers.includes(number))
    this.roomNumbers.push(number)

    let answers = []
    game.body.rounds.forEach(() => answers.push({}))

    this.games[game._id] = {
      owner: game.uname,
      players: [],
      title: game.title,
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

  getPlayerState(args) {
    let pid = args.pid

    for (game in this.games) {
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
    }

    return false
  }

  join(args) { // { name: "Alice Carroll", roomNumber: "982530", password: "six totally random words right here"}
    let name = args.name
    let roomNumber = args.roomNumber
    let password = args.password

    for (gid in this.games) {
      if (this.games[gid].roomNumber === roomNumber) {
        if (this.games[gid].password.toLowerCase().replace(/[^\w]/g, '') === password.toLowerCase().replace(/[^\w]/g, '')) {
          let pid = { id: crypto.createHash('sha256').update(name + Date.now()).digest('hex'), name: name }
          this.games[gid].players.push(pid)
          return pid
        }
      }
    }

    return false
  }

  answerRound(args) { // { pid: "hexstuff829u4h888e92bjheuf", round: 4, answers: ["Some answer", "another"] }
    let pid = args.pid
    let round = args.round
    let answers = args.answers

    for (gid in this.games) {
      let game = this.games[gid]
      for (player of game.players) {
        if (player.id === pid) {
          game.answers[round][pid] = answers
          return true
        }
      }
    }

    return false
  }

  autoScore(args) { // { gid: "morehex2o34u8f8j1u23u4uh", roundStart: 4, roundEnd: 7 }
    let gid = args.gid
    let roundStart = args.roundStart
    let roundEnd = args.roundEnd
    let game = this.games[gid]

    game.answers.slice(roundStart, roundEnd + 1).forEach((round, num) => {
      for (pid in round) {
        let scores = round[pid].map((answer, index) => answer.toLowerCase().replace(/[^\w]/g, '') === game.answerKey[num][index].toLowerCase().replace(/[^\w]/g, ''))

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
    gid = req.query.gid
  } catch (e) {}
  let game
  try {
    game = req.body
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

function playerAccess(req, res) {
  let pid
  try {
    pid = req.query.pid
  } catch (e) {}
  let round
  try {
    round = req.query.round
  } catch (e) {}
  let answers
  try {
    answers = req.query.answers
  } catch (e) {}
  let name
  try {
    name = req.query.name
  } catch (e) {}
  let roomNumber
  try {
    roomNumber = req.query.roomNumber
  } catch (e) {}
  let password
  try {
    password = req.query.password
  } catch (e) {}

  res.send(this.execute({ pid, round, answers, name, roomNumber, password }))
}

module.exports = {
  GameState,
  adminAccess,
  playerAccess
}
