/* eslint-disable no-param-reassign, operator-linebreak, no-restricted-properties */
import request from 'request-promise';
import querystring from 'querystring';

require('dotenv').config();

const randomNumber = require('random-number-csprng');

// How many digits the verification code should be
const verificationCodeLength = 6;

// How long the verification code is valid
const verificationCodeValidityInMilliseconds = 10 * 60 * 1000; // 10 minutes

// Regexp to look for verification code in message
const verificationCodeRegExp = /\b\d{6}\b/;
const authorizationUrl =
  'https://login.microsoftonline.com/common/oauth2/authorize';

//   const authorizationUrl =
//   'https://login.microsoftonline.com/common/oauth2/authorize';
const accessTokenUrl = 'https://login.microsoftonline.com/common/oauth2/token';
// const callbackPath = '/auth/azureADv1/callback';
const graphProfileUrl = 'https://graph.microsoft.com/v1.0/me';

const burl = process.env.BASE_APP_URL;

export const getAuthorizationUrl = (state, extraParams) => {
  let params = {
    response_type: 'code',
    response_mode: 'query',
    client_id: 'c486d868-092e-4bef-8355-c1f7385d48f6',
    redirect_uri: `${burl}/callback/azureADv1/auth`,
    resource: 'https://graph.microsoft.com',
    state,
  };
  if (extraParams) {
    params = { ...extraParams, ...params };
  }
  return `${authorizationUrl}?${querystring.stringify(params)}`;
};

// Ensure that data bag for the given provider exists
export function ensureProviderData(session) {
  if (!session.userData) {
    session.userData = {};
  }
}

// Gets the OAuth state for the given provider
export function getOAuthState(session) {
  ensureProviderData(session);
  return session.userData.oathState;
}

// Sets the OAuth state for the given provider
export function setOAuthState(session, state) {
  ensureProviderData(session);
  session.userData.oauthState = state;
  session.save().sendBatch();
}

// Gets the user token for the given provider, even if it has not yet been validated
function getUserTokenUnsafe(session) {
  ensureProviderData(session);
  return session.userData.userToken;
}

// Gets the validated user token for the given provider
export const getUserToken = (session) => {
  const token = getUserTokenUnsafe(session);
  return token && token.verificationCodeValidated ? token : null;
};

// Checks if the user has a token that is pending verification
export function isUserTokenPendingVerification(session) {
  const token = getUserTokenUnsafe(session);
  return !!(
    token &&
    !token.verificationCodeValidated &&
    token.verificationCode
  );
}

// Sets the user token for the given provider
export function setUserToken(session, token) {
  ensureProviderData(session);
  session.userData.userToken = token;
  session.save().sendBatch();
}

// Generate a verification code that the user has to enter to verify that the person that
// went through the authorization flow is the same one as the user in the chat.
async function generateVerificationCode() {
  const verificationCode = await randomNumber(
    0,
    Math.pow(10, verificationCodeLength) - 1,
  );
  return ('0'.repeat(verificationCodeLength) + verificationCode).substr(
    -verificationCodeLength,
  );
}

// Prepares a token for verification. The token is marked as unverified, and a
// new verification code is generated.
export async function prepareTokenForVerification(userToken) {
  userToken.verificationCodeValidated = true; // change to false TODO
  userToken.verificationCode = await generateVerificationCode();
  userToken.verificationCodeExpirationTime =
    Date.now() + verificationCodeValidityInMilliseconds;
}

// Finds a verification code in the text string
export function findVerificationCode(text) {
  const match = verificationCodeRegExp.exec(text);
  return match && match[0];
}

// Validates the received verification code against what is expected
// If they match, the token is marked as validated and can be used by the bot.
// Otherwise, the token is removed.
export function validateVerificationCode(session, verificationCode) {
  const tokenUnsafe = getUserTokenUnsafe(session);
  if (!tokenUnsafe.verificationCodeValidated) {
    if (
      verificationCode &&
      tokenUnsafe.verificationCode === verificationCode &&
      tokenUnsafe.verificationCodeExpirationTime > Date.now()
    ) {
      tokenUnsafe.verificationCodeValidated = true;
      setUserToken(session, tokenUnsafe);
    } else {
      // eslint-disable-next-line
      console.warn('Verification code does not match.');

      // Clear out the token after the first failed attempt to validate
      // to avoid brute-forcing the verification code
      setUserToken(session, null);
    }
  } else {
    // eslint-disable-next-line
    console.warn('Received unexpected login callback.');
  }
}

export const getAccessTokenAsync = async (code) => {
  const params = {
    grant_type: 'authorization_code',
    code,
    client_id: process.env.MICROSOFT_APP_ID,
    client_secret: process.env.MICROSOFT_APP_PASSWORD,
    redirect_uri: `${burl}/callback/azureADv1/auth`,
    resource: 'https://graph.microsoft.com',
  };
  try {
    const responseBody = await request.post({
      url: accessTokenUrl,
      form: params,
      json: true,
    });
    return {
      accessToken: responseBody.access_token,
      expirationTime: responseBody.expires_on * 1000,
    };
  } catch (error) {
    console.error(error); // eslint-disable-line
    throw error;
  }
};

export const getProfileAsync = async (accessToken) => {
  const options = {
    url: graphProfileUrl,
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  return request.get(options);
};
