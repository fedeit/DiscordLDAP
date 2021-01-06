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

function StatusPage () {
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
          <tr>
            <td style={leftColumnStyle}>Mailer</td>
            <td style={rightColumnStyle}>
              <FontAwesomeIcon icon={faExclamationCircle} color="orange" />
            </td>
          </tr>
          <tr>
            <td style={leftColumnStyle}>Discord API</td>
            <td style={rightColumnStyle}>
              <FontAwesomeIcon icon={faCheckCircle} color="green" />
            </td>
          </tr>
          <tr>
            <td style={leftColumnStyle}>LDAP</td>
            <td style={rightColumnStyle}>
              <FontAwesomeIcon icon={faCheckCircle} color="green" />
            </td>
          </tr>
          <tr>
            <td style={leftColumnStyle}>Database</td>
            <td style={rightColumnStyle}>
              <FontAwesomeIcon icon={faCheckCircle} color="green" />
            </td>
          </tr>
        </table>
      </header>
    </div>
  );
}

export default StatusPage;