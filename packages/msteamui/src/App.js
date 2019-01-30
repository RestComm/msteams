import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import microsoftTeams from '@microsoft/teams-js';
import {
  TeamsThemeContext,
  getContext,
  ThemeStyle,
} from 'msteams-ui-components-react';
import { ApolloProvider } from 'react-apollo';

import client from './Apolloclient';
import StaticTabPage from './Views/StaticTabPage';
import TeamsTab from './Views/TeamTabs';
import ConfigurationTab from './Views/ConfigureTab';
import AuthPages from './Views/AuthPage';
import SuccessOrFailedCallback from './Views/AuthPage/SuccessCallback';

class App extends Component {
  state = {
    theme: ThemeStyle.Light,
    fontSize: 16,
  };
  componentDidMount() {
    this.updateTheme(this.getQueryVariable('theme'));
    this.setState({
      fontSize: this.pageFontSize(),
    });

    // If you are not using the MS Teams web SDK, you can remove this entire if block, otherwise if you want theme
    // changes in the MS Teams client to propogate to the page, you should leave this here.
    if (this.inTeams()) {
      microsoftTeams.initialize();
      microsoftTeams.registerOnThemeChangeHandler(this.updateTheme);
    }
  }

  // Grabs the font size in pixels from the HTML element on your page.
  pageFontSize = () => {
    let sizeStr = window
      .getComputedStyle(document.getElementsByTagName('html')[0])
      .getPropertyValue('font-size');
    sizeStr = sizeStr.replace('px', '');
    let fontSize = parseInt(sizeStr, 10);
    if (!fontSize) {
      fontSize = 16;
    }
    return fontSize;
  };

  // Sets the correct theme type from the query string parameter.
  updateTheme = (themeStr) => {
    let theme;
    switch (themeStr) {
      case 'dark':
        theme = ThemeStyle.Dark;
        break;
      case 'contrast':
        theme = ThemeStyle.HighContrast;
        break;
      case 'default':
      default:
        theme = ThemeStyle.Light;
    }
    this.setState({ theme });
  };

  // Returns the value of a query variable.
  getQueryVariable = (variable) => {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (const varPairs of vars) {
      const pair = varPairs.split('=');
      if (decodeURIComponent(pair[0]) === variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    return null;
  };

  inTeams = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };
  render() {
    const context = getContext({
      baseFontSize: this.state.fontSize,
      style: this.state.theme,
    });

    return (
      <ApolloProvider client={client}>
        <TeamsThemeContext.Provider value={context}>
          <BrowserRouter>
            <Switch>
              <Route exact path="/personal" component={StaticTabPage} />
              <Route path="/team" component={TeamsTab} />
              <Route path="/configure" component={ConfigurationTab} />
              <Route path="/auth/start" component={AuthPages} />
              <Route
                path="/cbresult/:verificationCode/:result"
                component={SuccessOrFailedCallback}
              />
              <Route path="/" component={StaticTabPage} />
            </Switch>
          </BrowserRouter>
        </TeamsThemeContext.Provider>
      </ApolloProvider>
    );
  }
}

export default App;
