export const DialogIds = {
  RootDialogId: '/',
  GetLastDialogUsedDialogId: 'GetLastDialogUsedDialogId',
  sms: 'sms',
  help: 'help',
  greetings: 'greetings',
  init: '/init',
  reload: 'reload',
};

export const DialogMatches = {
  // sms: /^([\r\t\n\s]*)?sms(.*?)/gi,
  sms: /^([\n\r\t\s]*)?sms(.*)?/gi,
  start: /^(start|start\snew)/i,
  help: /^help/i,
  greetings: /^(greeting|greetings|hello)$/i,
  init: /\/init/i,
  reload: /^reload$/gi,
};
