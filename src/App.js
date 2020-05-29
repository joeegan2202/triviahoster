import React from 'react';
import './App.css';

import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom"

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  componentDidMount() {

  }

  render() {
    return (
      <Router>
        <div className="App">
        </div>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/join" exact component={Join} />
        </Switch>
      </Router>
    );
  }
}

const Join = () => {
  return (
    <div id="join">
      <h1>Please Join on this page!!!</h1>
      <Link to="/">Click here to go home</Link>
    </div>
  )
}

const Home = () => {
  return (
    <div id="home">
      <h1>This is the Home Page!!!!</h1>
      <Link to="/join">Click here to go to the join page</Link>
    </div>
  )
}

export default App;
