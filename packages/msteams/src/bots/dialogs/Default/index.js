import { Prompts } from 'botbuilder';
import { DialogIds, DialogMatches } from '../dialogIds';
import { TriggerDialog } from '../TriggerDialog';

export default (bot) => {
  const greetingsChoice = (session) => {
    Prompts.choice(session, 'Hello, how can I help you:', 'Send SMS | Help');
  };
  const greetingsAction = (session, result) => {
    switch (result.response.index) {
      case 0:
        session.beginDialog('sms');
        break;
      case 1:
        session.beginDialog('help');
        break;
      default:
        session.endDialog();
        break;
    }
  };

  const diaAction = new TriggerDialog(
    bot,
    DialogIds.greetings,
    DialogMatches.greetings,
  );
  diaAction.addActions([greetingsChoice, greetingsAction]);
};
