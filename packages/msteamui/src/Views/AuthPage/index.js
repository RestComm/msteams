import React, { Component } from 'react';
import microsoftTeams from '@microsoft/teams-js';

class AuthStartPage extends Component {
  componentDidMount() {
    microsoftTeams.initialize();
    // Parse query parameters
    let queryParams = {};
    window.location.search
      .substr(1)
      .split('&')
      .forEach(function(item) {
        let s = item.split('='),
          k = s[0],
          v = s[1] && decodeURIComponent(s[1]);
        queryParams[k] = v;
      });

    let authorizationUrl = queryParams['authorizationUrl'];
    if (authorizationUrl) {
      window.location.assign(authorizationUrl);
    }
  }
  render() {
    return <div>Loading...</div>;
  }
}

export default AuthStartPage;
