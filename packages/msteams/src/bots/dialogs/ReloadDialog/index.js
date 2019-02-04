/* eslint-disable no-param-reassign */

import { DialogIds, DialogMatches } from '../dialogIds';
import { TriggerDialog } from '../TriggerDialog';
import { CouchDatabase } from '../../../models';
import { getUserAddressFromDb, saveUserAddressToDb } from '../SMSDialog/utils';
import { getUserToken, getProfileAsync } from '../utils';

export default class ReloadDialog extends TriggerDialog {
  resetUserAccount = async (session) => {
    // check if the user has login.
    // read the profile and update the database.
    const userToken = getUserToken(session);
    if (!userToken) {
      session.send(
        'You have to login to authorize me to get your profile information',
      );
      session.replaceDialog(DialogIds.init);
      return;
    }
    try {
      const userDoc = await getUserAddressFromDb(session);
      if (userDoc) {
        const profile = await getProfileAsync(userToken.accessToken);
        if (profile.businessPhones && profile.businessPhones.length > 0) {
          const [senderNumber] = profile.businessPhones;
          session.userData.senderNumber = senderNumber;
          // save the number to database
          try {
            await saveUserAddressToDb(session, senderNumber);
          } catch (error) {
            session.endDialog('Please Try again');
            return;
          }
          session.endDialog('The reload was successful.');
        } else {
          session.endDialog(
            'Please contact the administrator to enable you to send SMS',
          );
        }
      }
    } catch (error) {
      session.endDialog();
    }
  };

  constructor(bot) {
    super(bot, DialogIds.reload, DialogMatches.reload);
    this.addActions([this.resetUserAccount]);
    this.db = new CouchDatabase().useDb();
  }
}
