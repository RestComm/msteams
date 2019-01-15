import React, { Component } from 'react';
import microsoftTeams from '@microsoft/teams-js';
import { graphql, Query } from 'react-apollo';
import { RegisterMemberGQL, QueryMemberDetailsGQL } from './graphq';

import RegisterNumber from './RegisterNumber';

class ConfigurationTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: '',
      teamId: '',
    };
  }
  componentDidMount() {
    microsoftTeams.initialize();
    microsoftTeams.getContext((ctx) => {
      if (ctx) {
        this.setState({ teamId: ctx.teamId });
        this.currentTeam = {
          teamId: ctx.teamId,
          teamName: ctx.teamName,
          channelId: ctx.channelId,
          channelName: ctx.channelName,
          locale: ctx.locale,
          loginHint: ctx.loginHint,
        };
      }
    });

    microsoftTeams.settings.registerOnSaveHandler(this.handleSaveSettings);
  }
  componentWillUnmount() {
    microsoftTeams.settings.registerOnRemoveHandler(this.handleSaveSettings);
  }

  handleSaveSettings = async (saveEvent) => {
    const conturl = window.location.protocol + '//' + window.location.host;
    try {
      microsoftTeams.settings.setSettings({
        contentUrl: conturl,
        entityId: conturl,
      });

      const result = await this.props.mutate({
        variables: {
          member: {
            phoneNumber: this.state.phoneNumber,
            ...this.currentTeam,
          },
        },
      });

      console.log(result);

      saveEvent.notifySuccess();
    } catch (error) {
      saveEvent.notifyFailure();
      console.log(error);
    }
  };

  onTextChange = (value) => {
    this.setState({ phoneNumber: value });
    microsoftTeams.settings.setValidityState(true);
  };
  render() {
    return (
      <Query
        query={QueryMemberDetailsGQL}
        variables={{ teamId: this.state.teamId }}
      >
        {({ loading, data, error }) => {
          if (loading) {
            return <div>Loading....</div>;
          }
          if (error) {
            return <div>Unknown error. Try again</div>;
          }

          let phone = '';
          if (data.getMemberById) {
            phone = data.getMemberById.phoneNumber;
          }
          return (
            <div>
              <RegisterNumber value={phone} onTextChange={this.onTextChange} />
            </div>
          );
        }}
      </Query>
    );
  }
}

export default graphql(RegisterMemberGQL)(ConfigurationTab);
