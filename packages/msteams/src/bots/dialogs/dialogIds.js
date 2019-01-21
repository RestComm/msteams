export const DialogIds = {
  RootDialogId: '/',
  GetLastDialogUsedDialogId: 'GetLastDialogUsedDialogId',
  sms: 'sms',
  help: 'help',
  greetings: 'greetings',
};

export const DialogMatches = {
  sms: /^sms(.*)/i,
  help: /^help/i,
  greetings: /^(greeting|greetings|hello)$/i,
};
