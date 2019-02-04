import { Message, HeroCard, CardAction } from 'botbuilder';
import uuidv4 from 'uuid/v4';

import { TriggerDialog } from '../TriggerDialog';
import { DialogIds, DialogMatches } from '../dialogIds';
import {
  getUserToken,
  // setUserToken,
  getAuthorizationUrl,
  setOAuthState,
} from '../utils';

require('dotenv').config();
// providerName = azureADv1

export default class AuthDialog extends TriggerDialog {
  // handleLogout = async (session) => {
  //   if (!getUserToken(session)) {
  //     session.send(`You're already signed out of ${this.providerDisplayName}.`);
  //   } else {
  //     setUserToken(session, null);
  //     session.send(`You're now signed out of ${this.providerDisplayName}.`);
  //   }

  //   await this.testauthDialog(session);
  // };

  handleLogin = async (session) => {
    if (getUserToken(session)) {
      session.send(`You're already signed in to ${this.providerDisplayName}.`);
      // await this.testauthDialog(session);
      session.replaceDialog('sms');
    } else {
      // Create the OAuth state, including a random anti-forgery state token
      const state = JSON.stringify({
        securityToken: uuidv4(),
        address: session.message.address,
      });
      setOAuthState(session, state);

      // Create the authorization URL
      const authUrl = getAuthorizationUrl(state);

      // Build the sign-in url
      const burl = process.env.BASE_APP_URL;
      const signinUrl = `${burl}/auth/start?authorizationUrl=${encodeURIComponent(
        authUrl,
      )}`;

      const signinUrlWithFallback = `${signinUrl}&fallbackUrl=${encodeURIComponent(
        signinUrl,
      )}`;

      // Send card with signin action
      const msg = new Message(session).addAttachment(
        new HeroCard(session)
          .text(
            `Authorization required. Kindly sign in to your ${
              this.providerDisplayName
            }.`,
          )
          .buttons([
            new CardAction(session)
              .type('signin')
              .value(signinUrlWithFallback)
              .title('Sign in'),
          ]),
      );
      session.send(msg);
    }
  };

  // testauthDialog = (session) => {
  //   // const { address } = session.message;
  //   // setUserToken(session, null);
  //   const msg = new Message(session).addAttachment(
  //     new ThumbnailCard(session).title('RestComm').buttons([
  //       CardAction.messageBack(session, '{}', 'Sign In')
  //         .text('SignIn')
  //         .displayText('Sign In'),
  //       CardAction.messageBack(session, '{}', 'Show Profile')
  //         .text('ShowProfile')
  //         .displayText('Show Profile'),
  //       CardAction.messageBack(session, '{}', 'Sign Out')
  //         .text('SignOut')
  //         .displayText('Sign Out'),
  //     ]),
  //   );
  //   session.send(msg);
  // };

  constructor(bot) {
    super(bot, DialogIds.init, DialogMatches.init);
    this.addActions([this.handleLogin, this.showUserProfile]);
    this.providerDisplayName = 'Microsoft Account';
  }
}
