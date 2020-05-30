import React from 'react'
import './App.css'
import Join from './Join'
import Play from './Play'
import Admin from './Admin'

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            page: 'join',
            pid: null,
            session: null
        }
    }

    jsonCookie() { // Method to convert cookie data to parsed json automatically
        let cookie = '{"' + document.cookie + '"}'

        cookie = cookie.replace(/; /g, '", "')
        cookie = cookie.replace(/=/g, '":"')

        console.log(cookie)

        try {
            return JSON.parse(cookie)
        } catch (error) {
            return false
        }
    }

    join(name, roomNumber, password) {
        fetch(`https://trivia.eganshub.net:3500/play/join?name=${name}&roomNumber=${roomNumber}&password=${password}`, { method: 'POST' })
            .then(data => data.json())
            .then(pid => (pid ? this.setState({ page: 'play', pid }) : null)) // TODO: Handle error here
            .catch(err => console.log(err))
    }

    login(uname, password) {
        fetch(`https://trivia.eganshub.net:3500/admin/login?uname=${uname}&password=${password}`, { method: 'POST' })
            .then(data => data.json())
            .then(session => (session ? this.setState({ session }) : null)) // TODO: Handle error here
            .catch(err => console.log(err))
    }

    componentDidMount() {

    }

    render() {
        return (
            <div id="App">
                {this.state.pid}
                {(this.state.page === 'join' ? <Join login={(() => this.setState({ page: 'admin' })).bind(this)} join={this.join.bind(this)} /> : null)}
                {(this.state.page === 'play' ? <Play /> : null)}
                {(this.state.page === 'admin' ? <Admin login={this.login.bind(this)} /> : null)}
            </div>
        )
    }
}

export default App;
