// Generic utilities
module.exports = {
  verifySessionId,
}

function verifySessionId(session, uname, callback) {
  global.main.collection('sessions').findOne({ session, uname }, (err, find) => {
    if (find) {
      if (Date.now() - find.time < 30 * 60 * 1000) {
        let result = { session: find.session, uname: find.uname }
        console.log(`Session authenticated: ${find.session}`)

        callback(result)
      } else {
        global.main.collection('sessions').deleteOne({ session })
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}
