import React from 'react'

export class Join extends React.Component {
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
          <a onClick={this.props.login()}>Host Login</a>
        </div>
        <form onSubmit={this.props.join()}>
          <input id="roomNumber" defaultValue="Room Number:"></input>
          <input id="password" defaultValue="Room Password:"></input>
          <button id="submit" type="submit">Join Room</button>
        </form>
      </div>
    )
  }
}
