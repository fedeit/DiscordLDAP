import React from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faPlus } from '@fortawesome/free-solid-svg-icons';

let leftColumnStyle = {
  textAlign: "left"
}

let rightColumnStyle = {
  textAlign: "right"
}

class StatusPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {status: []}
  }

  componentDidMount() {
    console.log("Fetching status")
    axios.get('/api/status')
    .then((res) => {
      console.log(res.data)
      this.setState(res.data)
    })
    .catch((err) => {
      alert(`API is down! Couldn't fetch status. ${err}`)
    })
  }

  render() {
    return (
      <div>
        <header className="App-header">
          <table>
            <tr>
              <td><img src="active-directory.png" style={{height: "60px"}}/></td>
              <td><FontAwesomeIcon icon={faPlus} color="white" /></td>
              <td><img src="discord-logo.png" style={{height: "60px"}}/></td>
            </tr>
          </table>
          <h2 style={{textAlign: "center"}}>DiscordLDAP Service Status</h2>
          <table style={{width: "40%"}}>
          {
            this.state.status.map(service => (
              <tr>
                <td style={leftColumnStyle}>{service.name}</td>
                <td style={rightColumnStyle}>
                { service.isUp && <FontAwesomeIcon icon={faCheckCircle} color="green" /> }
                { !service.isUp && <FontAwesomeIcon icon={faExclamationCircle} color="orange" /> }
                </td>
              </tr>
            ))
          }
          </table>
        </header>
      </div>
    );
  }
}

export default StatusPage;