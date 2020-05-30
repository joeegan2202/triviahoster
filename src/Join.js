import React from 'react'

export default class Join extends React.Component {
  constructor(props) {
    super(props)

    this.state = {

    }
  }

  render() {
    return (
      <div id="join">
        <div id="header">
          <h1>Play Trivia</h1>
          <a onClick={this.props.login}>Host Login</a>
        </div>
        <form onSubmit={e => {e.preventDefault(); this.props.join(document.getElementById('name').value, document.getElementById('roomNumber').value, document.getElementById('password').value)}}>
          <input id="name" placeholder="Your Name:"></input>
          <input id="roomNumber" placeholder="Room Number:"></input>
          <input id="password" placeholder="Room Password:"></input>
          <button id="submit" type="submit">Join Room</button>
        </form>
      </div>
    )
  }
}
