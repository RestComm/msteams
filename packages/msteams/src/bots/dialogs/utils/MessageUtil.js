/* eslint-disable no-param-reassign, no-lonely-if,no-underscore-dangle,arrow-body-style,
implicit-arrow-linebreak, prefer-template, operator-linebreak */

import urlJoin from 'url-join';
import { Message } from 'botbuilder';
import request from 'request';
import { getLogger } from '../../../utils';

const { debug } = getLogger('msgutil');
// Creates a new Message
// Unlike the botbuilder constructor, this defaults the textFormat to "xml"
// eslint-disable-next-line
export const createMessage = (session, text = '', textFormat = 'xml') => {
  return new Message(session).text(text).textFormat('xml');
};

// Get the channel id in the event
export const getChannelId = (event) => {
  const { sourceEvent } = event;
  if (sourceEvent && sourceEvent.channel) {
    return sourceEvent.channel.id;
  }

  return '';
};

// Get the team id in the event
export const getTeamId = (event) => {
  const { sourceEvent } = event;
  if (sourceEvent && sourceEvent.team) {
    return sourceEvent.team.id;
  }
  return '';
};

// Add access token to request options
const addAccessToken = (chatConnector, options) => {
  return new Promise((resolve, reject) => {
    // ChatConnector type definition doesn't include getAccessToken
    chatConnector.getAccessToken((err, token) => {
      if (err) {
        reject(err);
      } else {
        options.headers = {
          Authorization: `Bearer ${token}`,
        };
        resolve();
      }
    });
  });
};

// Get the tenant id in the event
export const getTenantId = (event) => {
  const { sourceEvent } = event;
  if (sourceEvent && sourceEvent.tenant) {
    return sourceEvent.tenant.id;
  }
  return '';
};

// Returns true if this is message sent to a channel
export const isChannelMessage = (event) => {
  return !!getChannelId(event);
};

// Returns true if this is message sent to a group (group chat or channel)
export const isGroupMessage = (event) => {
  return event.address.conversation.isGroup || isChannelMessage(event);
};

// Strip all mentions from text
export const getTextWithoutMentions = (message) => {
  let { text } = message;
  if (message.entities) {
    message.entities
      .filter((entity) => entity.type === 'mention')
      .forEach((entity) => {
        text = text.replace(entity.text, '');
      });
    text = text.trim();
  }
  return text;
};

// Get all user mentions
export const getUserMentions = (message) => {
  const entities = message.entities || [];
  const botMri = message.address.bot.id.toLowerCase();
  return entities.filter(
    (entity) =>
      entity.type === 'mention' && entity.mentioned.id.toLowerCase() !== botMri,
  );
};

// Create a copy of address with the data from the response
function createAddressFromResponse(address, response) {
  const result = {
    ...address,
    conversation: { id: response.id },
    useAuth: true,
  };
  if (result.id) {
    delete result.id;
  }
  if (response.activityId) {
    result.id = response.activityId;
  }
  return result;
}
// Create a mention entity for the user that sent this message
export const createUserMention = (message) => {
  const { user } = message.address;
  const text = `<at>${user.name}</at>`;
  const entity = {
    type: 'mention',
    mentioned: user,
    entity: text,
    text,
  };
  return entity;
};

// Send an authenticated request
const sendRequestWithAccessToken = async (chatConnector, options) => {
  // Add access token
  await addAccessToken(chatConnector, options);

  // Execute request
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        if (response.statusCode < 400) {
          try {
            const result = typeof body === 'string' ? JSON.parse(body) : body;
            resolve(result);
          } catch (e) {
            reject(e instanceof Error ? e : new Error(e.toString()));
          }
        } else {
          const txt =
            "Request to '" +
            options.url +
            "' failed: [" +
            response.statusCode +
            '] ' +
            response.statusMessage;
          reject(new Error(txt));
        }
      }
    });
  });
};

// Gets the members of the given conversation.
// Parameters:
//      chatConnector: Chat connector instance.
//      address: Chat connector address. "serviceUrl" property is required.
//      conversationId: [optional] Conversation whose members are to be retrieved, if not specified,
//      the id is taken from address.conversation.
// Returns: A list of conversation members.
export const getConversationMembers = async (
  chatConnector,
  address,
  conversationId,
) => {
  // Build request
  conversationId = conversationId || address.conversation.id;
  const options = {
    method: 'GET',
    // We use urlJoin to concatenate urls. url.resolve should not be used here,
    // since it resolves urls as hrefs are resolved, which could result in losing
    // the last fragment of the serviceUrl
    url: urlJoin(
      address.serviceUrl,
      `/v3/conversations/${conversationId}/members`,
    ),
    json: true,
  };

  const response = await sendRequestWithAccessToken(chatConnector, options);
  if (response) {
    return response;
  }
  throw new Error('Failed to get conversation members.');
};

// Starts a 1:1 chat with the given user.
// Parameters:
//      chatConnector: Chat connector instance.
//      address: Chat connector address. "bot", "user" and "serviceUrl" properties are required.
//      channelData: Channel data object. "tenant" property is required.
// Returns: A copy of "address", with the "conversation" property
// referring to the 1:1 chat with the user.
export const startConversation = async (
  chatConnector,
  address,
  channelData,
) => {
  // Build request
  const options = {
    method: 'POST',
    // We use urlJoin to concatenate urls. url.resolve should not be used here,
    // since it resolves urls as hrefs are resolved, which could result in losing
    // the last fragment of the serviceUrl
    url: urlJoin(address.serviceUrl, '/v3/conversations'),
    body: {
      bot: address.bot,
      members: [address.user],
      channelData,
    },
    json: true,
  };

  const response = await sendRequestWithAccessToken(chatConnector, options);
  // eslint-disable-next-line
  if (response && response.hasOwnProperty('id')) {
    return createAddressFromResponse(address, response);
  }
  throw new Error('Failed to start conversation: no conversation ID returned.');
};

// Starts a new reply chain by posting a message to a channel.
// Parameters:
//      chatConnector: Chat connector instance.
//      message: The message to post. The address in this message is ignored,
//      and the message is posted to the specified channel.
//      channelId: Id of the channel to post the message to.
// Returns: A copy of "message.address", with the "conversation"
//  property referring to the new reply chain.
export const startReplyChain = async (chatConnector, message, channelId) => {
  const activity = message.toMessage();

  // Build request
  const options = {
    method: 'POST',
    // We use urlJoin to concatenate urls. url.resolve should not be used here,
    // since it resolves urls as hrefs are resolved, which could result in losing
    // the last fragment of the serviceUrl
    url: urlJoin(activity.address.serviceUrl, '/v3/conversations'),
    body: {
      isGroup: true,
      activity,
      channelData: {
        teamsChannelId: channelId,
      },
    },
    json: true,
  };

  const response = await sendRequestWithAccessToken(chatConnector, options);
  // eslint-disable-next-line
  if (response && response.hasOwnProperty('id')) {
    const address = createAddressFromResponse(activity.address, response);
    if (address.user) {
      delete address.user;
    }
    if (address.correlationId) {
      delete address.correlationId;
    }
    return address;
  }
  throw new Error('Failed to start reply chain: no conversation ID returned.');
};

// Get locale from client info in event
export function getLocale(evt) {
  const event = evt;
  if (event.entities && event.entities.length) {
    const clientInfo = event.entities.find(
      (e) => e.type && e.type === 'clientInfo',
    );
    return clientInfo.locale;
  }
  return null;
}

// Load a Session corresponding to the given event
export function loadSessionAsync(bot, event) {
  return new Promise((resolve, reject) => {
    bot.loadSession(event.address, (err, session) => {
      if (err) {
        debug('Failed to load session', {
          error: err,
          address: event.address,
        });
        reject(err);
      } else if (!session) {
        debug('Loaded null session', { address: event.address });
        reject(new Error('Failed to load session'));
      } else {
        const locale = getLocale(event);
        if (locale) {
          session._locale = locale;
          session.localizer.load(locale, (err2) => {
            // Log errors but resolve session anyway
            if (err2) {
              debug(`Failed to load localizer for ${locale}`, err2);
            }
            resolve(session);
          });
        } else {
          resolve(session);
        }
      }
    });
  });
}
