import React, { Component } from 'react';
// import styled from 'styled-components';
import {
  Input,
  TeamsThemeContext,
  Panel,
  PanelBody,
  PanelHeader,
  PanelFooter,
} from 'msteams-ui-components-react';

class RegisterNumber extends Component {
  constructor(props) {
    super(props);
    this.state = {
      restcommpstn: props.value || '',
    };
  }

  onTextChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
    // check if the number is more than six
    if (value.length > 6) {
      this.props.onTextChange(value);
    }
  };

  render() {
    return (
      <TeamsThemeContext.Consumer>
        {(context) => {
          const { rem, font } = context;
          const { sizes, weights } = font;

          const styles = {
            header: { ...sizes.title, ...weights.semibold },
            input: {
              paddingTop: rem(0.5),
              width: '50%',
            },
          };
          return (
            <Panel>
              <PanelHeader>
                <div style={styles.header}>RestComm PTSN Number</div>
              </PanelHeader>
              <PanelBody>
                <Input
                  name="restcommpstn"
                  id="restcommpstn"
                  autoFocus
                  style={styles.input}
                  placeholder="PTSN Number"
                  label="Enter the RestComm PTSN Number"
                  errorLabel={
                    !this.state.restcommpstn ? 'This value is required' : null
                  }
                  value={this.state.restcommpstn}
                  onChange={(e) => this.onTextChange(e)}
                  required
                />
              </PanelBody>
              <PanelFooter />
            </Panel>
          );
        }}
      </TeamsThemeContext.Consumer>
    );
  }
}

export default RegisterNumber;
