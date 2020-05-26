// For admin game management
const utils = require('./utils')

module.exports = {
  create,
  deleteGame,
  get
}

function create(req, res) {
  let uname
  try {
    uname = '' + req.query.uname
  } catch (e) {
    console.log('User tried to create game with invalid username')
    res.send(false)
    return
  }
  let session
  try {
    session = '' + req.query.session
  } catch (e) {
    console.log('User tried to create game with invalid session')
    res.send(false)
    return
  }

  console.log(req.body)

  utils.verifySessionId(session, uname, (result) => {
    if (result) {
      global.main.collection('admin-games').insertOne({ uname, created: Date.now(), body: req.body }, (err, result) => {
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
}

function deleteGame(req, res) {
  let uname
  try {
    uname = '' + req.query.uname
  } catch (e) {
    console.log('User tried to delete game with invalid username')
    res.send(false)
    return
  }
  let session
  try {
    session = '' + req.query.session
  } catch (e) {
    console.log('User tried to delete game with invalid session')
    res.send(false)
    return
  }
  let gameId
  try {
    gameId = '' + req.query.gameId
  } catch (e) {
    console.log('User tried to delete game with invalid game id')
    res.send(false)
    return
  }

  utils.verifySessionId(session, uname, (result) => {
    if (result) {
      global.main.collection('admin-games').deleteOne({ _id: gameId, uname }, (err, result) => {
        if (err) {
          console.log('could not delete game')
          res.send(false)
        } else {
          res.send(true)
        }
      })
    } else {
      console.log('Session did not verify to delete game')
      res.send(false)
    }
  })
}

function get(req, res) {
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

  utils.verifySessionId(session, uname, (result) => {
    if (result) {
      global.main.collection('admin-games').find({ uname }, { uname: false }).toArray((err, result) => {
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
}
