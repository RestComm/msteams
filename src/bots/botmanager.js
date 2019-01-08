import { MemoryStorage, UniversalBot } from 'botbuilder';
import { TeamsChatConnector, TeamsMessage } from 'botbuilder-teams';

export default class BotManager {
  setup = (app) => {
    const connector = new TeamsChatConnector({
      appId: process.env.MICROSOFT_APP_ID,
      appPassword: process.env.MICROSOFT_APP_PASSWORD,
    });

    const inMemoryBotStorage = new MemoryStorage();

    const bot = new UniversalBot(connector, (session) => {
      const text = TeamsMessage.getTextWithoutMentions(session.message);
      console.log(`You said: ${text}`); // eslint-disable-line
      session.send('You said: %s', text);
    });
    bot.set('storage', inMemoryBotStorage);

    app.post('/api/messages', connector.listen());
  };
}
