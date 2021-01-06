import logo from './logo.svg';
import './App.css';
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import StatusPage from './statusPage.js';
import Register from './registerPage.js';

function App() {
  return (
    <div className="App"> 
      <Router>
        <Switch>
          <Route exact path="/status">
            <StatusPage />
          </Route>
          <Route path="/">
            <Register />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
