import React, { Component } from 'react';
import microsoftTeams from '@microsoft/teams-js';

class SuccessOrFailedCallback extends Component {
  constructor(props) {
    super(props);
    const { match } = props;
    const verCode = match.params.verificationCode;
    this.isfailed = match.params.result === 'failed';
    this.state = {
      verificationCode: verCode || '',
    };
  }
  componentDidMount() {
    microsoftTeams.initialize();
    if (!this.isfailed) {
      microsoftTeams.authentication.notifySuccess(
        `'${this.state.verificationCode}'`,
      );
    }
  }
  render() {
    if (this.isfailed) {
      return (
        <div>
          There was an error authenticating with Azure Provider. Please try
          again
        </div>
      );
    }
    return (
      <div id="instructionText" style={{ display: 'none' }}>
        <div class="instruction-text">
          <p>You're almost there!</p>
          <span class="verification-code">{this.state.verificationCode}</span>
          <p>in the Microsoft Teams chat window.</p>
        </div>
      </div>
    );
  }
}

export default SuccessOrFailedCallback;
