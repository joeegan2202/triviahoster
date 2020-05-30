import React from 'react'

export default class Admin extends React.Component {
  constructor(props) {
    super(props)

    this.state = {

    }
  }

  render() {
    return (
      <div id="admin">
        <form onSubmit={e => {e.preventDefault(); this.props.login(document.getElementById('uname').value, document.getElementById('password').value)}}>
          <input id="uname" placeholder="Username:"></input>
          <input id="password" placeholder="Password:"></input>
          <button type="submit">Log In</button>
        </form>
      </div>
    )
  }
}
