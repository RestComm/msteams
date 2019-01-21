/* eslint-disable function-paren-newline */
/* eslint-disable no-param-reassign, implicit-arrow-linebreak,no-useless-constructor */
import { DialogIds } from './dialogIds';

export class BaseDialog {
  constructor(dialogId) {
    this.dialogId = dialogId;
  }

  getDialogId = () => this.getDialogId;
}

export class BaseTriggerDialog extends BaseDialog {
  constructor(dialogId) {
    super(dialogId);
  }

  addDialogBotAction = (bot, dialogId, match, action, constructorArgs) => {
    let newActionList = [];
    newActionList.push((session, args, next) =>
      this.setDialogAsCurrrent(session, args, next),
    );
    newActionList.push((session, args, next) => {
      args.constructorArgs = constructorArgs || {};
      args.constructorArgs.bot = bot;
      next(args);
    });
    if (Array.isArray(action)) {
      newActionList = newActionList.concat(action);
    } else {
      newActionList.push(action);
    }
    bot.dialog(dialogId, newActionList).triggerAction({ matches: match });
  };

  setDialogAsCurrrent = (session, args, next) => {
    if (this.getDialogId() !== DialogIds.GetLastDialogUsedDialogId) {
      session.conversationData.currentDialogName = this.getDialogId();
    }
    next(args);
  };
}

export class TriggerDialog extends BaseTriggerDialog {
  constructor(bot, dialogId, match, constructorArgs) {
    super(dialogId);
    this.did = dialogId;
    this.bot = bot;
    this.match = match;
    this.constructorArgs = constructorArgs;
  }

  addActions = (action) => {
    // const dId = this.getDialogId();
    this.addDialogBotAction(
      this.bot,
      this.did,
      this.match,
      action,
      this.constructorArgs,
    );
  };
}
