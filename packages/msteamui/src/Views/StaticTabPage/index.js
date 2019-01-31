import React from 'react';
import styled from 'styled-components';
import BackgroundImg from '../../Assets/restcommbg.png';

const HeaderView = styled.div`
  padding-top: 25px !important;
  padding-bottom: 25px !important;
  background-color: #e8f6fb;
  background-image: url(${(props) => props.Image});
  height: 400px;
  background-repeat: no-repeat;
  background-position: center center;
  -webkit-background-size: contain;
  -moz-background-size: contain;
  -o-background-size: contain;
  background-size: contain;
`;
const HeaderTitle = styled.h1`
  text-align: center;
  padding-top: 25px;
  font-weight: 600;
  font-size: 34px;
  color: #252e4e;
`;

const BodyText = styled.div`
  margin: 30px 20px;
  text-align: center;
`;
const Container = styled.div`
  padding: 25px;
`;
// provide information to the customer
const PersonalTab = () => {
  return (
    <Container>
      <HeaderView Image={BackgroundImg}>
        <HeaderTitle>Making Business Communications Simple</HeaderTitle>
      </HeaderView>
      <BodyText>
        TeleSax Demo application allows you to communicate via SMS to your
        trusted partners. Your system administrator needs to enable RestComm
        PSTN number in your profile.
        <br />
        <br />
        NOTE: The Restcomm number should support message and voice
      </BodyText>
    </Container>
  );
};

export default PersonalTab;
