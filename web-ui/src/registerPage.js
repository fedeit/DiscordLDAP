import React from "react";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import 'bootstrap/dist/css/bootstrap.css';
import './Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

class Register extends React.Component {
  constructor(props) {
    super(props);
    let path = window.location.pathname.replace(/\//g, '');
    let message = undefined;
    if (path.length !== 32) {
      message = "Invalid link! Make sure you copied it correctly!";
    }
    this.state = {verified: false, password: "", username:"", path: path, message: message};
  }

  setUsername(val) {
    this.setState({username: val})
  }

  setPassword(val) {
    this.setState({password: val})
  }

  validateForm() {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  handleSubmit(event) {
    event.preventDefault();
    axios.post("/verify", {password: this.state.password, username: this.state.username, code: this.state.path})
    .then((res) => {
      if (res.data.verified) {
        this.setState({verified: true, message: res.data.message});
      } else {
        this.setState({verified: false, message: res.data.message});
      }
    })
    .catch((err) => {
        this.setState({verified: false, message: err.message});
    })
  }

  render() {
    if (this.state.verified) {
      return (
        <div style={{padding: '20%'}}>
          <FontAwesomeIcon icon={faCheckCircle} color="green" size='10x'/>
          <h1>{this.state.message}</h1>
        </div>
      );
    }
    return (
      <div className="Login">
          <h2 style={{textAlign: "center"}}>Discord Verification</h2>
          <p style={{color: "red"}}>{this.state.message}</p>
          <Form onSubmit={this.handleSubmit.bind(this)}>
            <Form.Group size="lg" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                autoFocus
                type="text"
                value={this.state.username}
                onChange={(e) => this.setUsername(e.target.value)}
                name="username" 
              />
            </Form.Group>
            <Form.Group size="lg" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={this.state.password}
                onChange={(e) => this.setPassword(e.target.value)}
                name="password"
              />
            </Form.Group>
            <Button block size="lg" type="submit" disabled={!this.validateForm()}>
              Login
            </Button>
          </Form>
      </div>
    );
  }
}

export default Register;