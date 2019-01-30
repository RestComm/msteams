/* eslint-disable operator-linebreak */
import { UniversalBot, Message, HeroCard } from 'botbuilder';
import { TeamsMessage, StripBotAtMentions } from 'botbuilder-teams';
import { getLogger } from '../utils';
import RootDialog from './dialogs';
import { CouchDatabase } from '../models';
import {
  loadSessionAsync,
  setUserToken,
  prepareTokenForVerification,
  getAccessTokenAsync,
} from './dialogs/utils';

const { debug, cerror } = getLogger('bot');

export default class BotManager extends UniversalBot {
  constructor(_connector, botSettings) {
    super(_connector, botSettings);

    this.teamconnector = _connector;

    new RootDialog(this).register();

    this.use(new StripBotAtMentions());

    // this.on('conversationUpdate', (msg) => {
    //   try {
    //     debug('%o', msg);
    //     const event = TeamsMessage.getConversationUpdateData(msg);
    //     debug('event');
    //     debug(event);
    //   } catch (error) {
    //     cerror(error.message);
    //   }
    // });
    this.database = new CouchDatabase().useDb();
  }

  /**
   *Send a message to the MS Team using the bot manager
   * @param {String} message The message to be sent to the MS Channel
   * @memberof BotManager
   */
  sendMessage = async (message, sender, receiver) => {
    // check if the receiver is in the database
    try {
      const queryselector = {
        selector: {
          phoneNumber: {
            $eq: receiver,
          },
        },
      };

      const { docs } = await this.database.find(queryselector);

      if (docs.length > 0) {
        const mdoc = docs[0];
        // get the save address
        if (mdoc.address) {
          const nmsg = new Message().address(mdoc.address);
          nmsg.addAttachment(this.adaptiveCard(message, sender));
          // nmsg.text(message);
          nmsg.textLocale('en-US');
          this.send(nmsg);
          // this.teamconnector.startReplyChain(
          //   mdoc.address.serviceUrl,
          //   mdoc.channelId,
          //   nmsg,
          //   async (err, addr) => {
          //     if (err) {
          //       cerror(err);
          //       // this.endDialog('There is some error');
          //     } else {
          //       debug('%o', addr);
          //       try {
          //         const { id } = addr.conversation;
          //         const newconv = Object.assign({}, addr, {
          //           phoneNumber: sender,
          //           receiver,
          //           createdAt: new Date(),
          //         });
          //         await this.database.insert(newconv, id);
          //       } catch (error) {
          //         cerror(error.message);
          //       }
          //     }
          //   },
          // );

          return {
            status: true,
            message: 'success',
          };
        }
      }
      return {
        status: false,
        message: 'Unknown error',
      };
    } catch (error) {
      cerror(error.message);
      return {
        status: false,
        message: error.message,
      };
    }
  };

  adaptiveCard = (message, from) => {
    const thnail = new HeroCard().subtitle(`From: ${from}`).text(message);
    return thnail.toAttachment();
  };

  handleOAuthCallback = async (req, res) => {
    const stateString = req.query.state;
    const state = JSON.parse(stateString);
    const authCode = req.query.code;
    let verificationCode = '';

    // Load the session from the address information in the OAuth state.
    // We'll later validate the state to check that it was not forged.
    let session;

    try {
      const { address } = state;
      session = await loadSessionAsync(this, {
        type: 'invoke',
        agent: 'botbuilder',
        source: address.channelId,
        sourceEvent: {},
        address,
        user: address.user,
      });
    } catch (e) {
      debug('Failed to get address from OAuth state', e);
    }

    if (session && authCode) {
      // User granted authorization
      try {
        const userToken = await getAccessTokenAsync(authCode);

        await prepareTokenForVerification(userToken);
        setUserToken(session, userToken);
        // eslint-disable-next-line
        verificationCode = userToken.verificationCode;
      } catch (e) {
        debug('Failed to redeem code for an access token', e);
      }
    } else {
      debug(
        'State does not match expected state parameter, or user denied authorization',
      );
    }

    // Render the page shown to the user
    if (verificationCode) {
      const address = JSON.parse(req.query.state);
      const nmsg = new Message().address(address.address);
      nmsg.textLocale('en-US');
      nmsg.text('You have logged in successfully. Type help or sms to begin!!');
      this.send(nmsg);
      res.redirect(`/cbresult/${verificationCode}/success`);
    } else {
      if (req.query && req.query.state) {
        const address = JSON.parse(req.query.state);
        const nmsg = new Message().address(address.address);
        nmsg.textLocale('en-US');
        nmsg.text('Failed to login, Please try again!!');
        this.send(nmsg);
      }
      res.redirect('/cbresult/failed/failed');
    }
  };
}
