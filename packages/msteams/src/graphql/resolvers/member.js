// import { ApolloError } from 'apollo-server-express';
import { getLogger } from '../../utils';

const { debug, cerror } = getLogger('member');

const getdoc = async (id, db) => {
  try {
    return await db.get(id);
  } catch (error) {
    return null;
  }
};

const getMemberById = async (_, { teamId }, { db }) => {
  try {
    return await db.get(teamId);
  } catch (error) {
    cerror(error.message);
    return null;
  }
};

const getMemberByPhone = async (_, { phoneNumber }, { db }) => {
  try {
    const queryselector = {
      selector: {
        phoneNumber: {
          $eq: phoneNumber,
        },
      },
    };

    const { docs } = await db.find(queryselector);

    if (docs.length > 0) {
      return docs[0];
    }
    return null;
  } catch (error) {
    throw error;
  }
};

/**
 * register a new member on the TeleStax system for sending and receiving SMS
 * @param {Object} obj contains the result returned from the resolver on the parent field
 * @param {Object} args An object with the arguments passed into the field in the query
 * @param {Object} ctx context
 */
const registerMember = async (_, { member }, { db }) => {
  try {
    // check if the document exist. if it exist update it and if not create it.
    const { teamId } = member;
    const doc = await getdoc(teamId, db);
    if (doc) {
      const updatedoc = Object.assign(doc, member, { updatedAt: new Date() });
      const response = await db.insert(updatedoc);
      debug(response);
      return {
        result: true,
        desc: 'Account successfully updated',
      };
    }
    const newdoc = Object.assign({}, member, { createdAt: new Date() });
    await db.insert(newdoc, teamId);
    return {
      result: true,
      desc: 'Account information added successfully',
    };
  } catch (error) {
    throw error;
  }
};
export default {
  Query: {
    getMemberById,
    getMemberByPhone,
  },
  Mutation: {
    registerMember,
  },
};
