/* eslint-disable implicit-arrow-linebreak */
import Redis from 'ioredis';

require('dotenv').config();

const toCamelCase = (strkey) => {
  const str = strkey.replace(/^REDIS_/g, '');
  return str.replace(/^([A-Z])|[\s-_](\w)/g, (match, p1, p2) => {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  });
};

const getRedisConfig = () => {
  const regex = /^REDIS_.+/;

  const envKeys = Object.keys(process.env)
    .filter((item) => regex.test(item))
    .map((item) => ({
      [toCamelCase(item)]: process.env[item],
    }));
  if (envKeys && envKeys.length > 0) {
    return Object.assign(...envKeys);
  }
  return {};
};

const storeKeys = {
  userData: 'userData',
  conversationData: 'conversationData',
  privateConversationData: 'privateConversationData',
};

const conversationKey = (context) =>
  `${storeKeys.conversationData}:conversation:${context.conversationId}`;

// var key = context.userId + ':' + context.conversationId;
const privateConversationKey = (context) => {
  const pv = storeKeys.privateConversationData;
  return `${pv}:user:${context.userId}:conversation:${context.conversationId}`;
};

const userKey = (context) => `${storeKeys.userData}:user:${context.userId}`;

export default class RedisStorage {
  /**
   *Creates an instance of RedisStorage.
   * @param {Object} db if defined it the time in seconds for messages to auto expire
   * @param {Number} timeToLive delete the document when the time elapse
   * @memberof RedisStorage
   */
  constructor(timeToLive) {
    this.redis = new Redis({ ...getRedisConfig() });
    this.timeToLive = timeToLive;
  }

  /**
   * get data from storage
   * @param {IBotStorageContext} context
   * @param {function} callback callback: (err: Error, data: IBotStorageData) => void
   * @memberof RedisStorage
   */
  getData = async (context, callback) => {
    const data = {};
    const commandlist = [];
    if (context.userId) {
      if (context.persistUserData) {
        commandlist.push({
          key: userKey(context),
          type: storeKeys.userData,
        });
      }
      if (context.conversationId) {
        commandlist.push({
          key: privateConversationKey(context),
          type: storeKeys.privateConversationData,
        });
      }
    }

    if (context.persistConversationData && context.conversationId) {
      commandlist.push({
        key: conversationKey(context),
        type: storeKeys.conversationData,
      });
    }
    // get the data from database and return data of type data.userData|data.privateConversationData
    //  data.conversationData
    try {
      await Promise.all(
        commandlist.map(
          (entity) =>
            new Promise(async (resolve, reject) => {
              try {
                const entitydata = await this.redis.get(entity.key);
                data[entity.type] = JSON.parse(entitydata || '{}');
                resolve();
              } catch (error) {
                reject(error);
              }
            }),
        ),
      );
      callback(null, data);
    } catch (err) {
      callback(err, {});
    }
  };

  /**
   * save data to storage
   * @param {IBotStorageContext} context
   * @param {IBotStorageData} data
   * @param {function} callback callback?: (err: Error) => void
   * @memberof RedisStorage
   */
  saveData = (context, data, callback) => {
    const commandlist = [];
    if (context.userId) {
      // Write userData
      if (context.persistUserData) {
        commandlist.push({
          data: data[storeKeys.userData] || {},
          key: userKey(context),
        });
      }

      if (context.conversationId) {
        // Write privateConversationData
        commandlist.push({
          data: data[storeKeys.privateConversationData] || {},
          key: privateConversationKey(context),
        });
      }
    }

    if (context.persistConversationData && context.conversationId) {
      // Write conversationData
      commandlist.push({
        data: data[storeKeys.conversationData] || {},
        key: conversationKey(context),
      });
    }

    Promise.all(
      commandlist.map(
        (entity) =>
          new Promise(async (resolve, reject) => {
            try {
              const value = JSON.stringify(entity.data);
              if (this.timeToLive) {
                await this.redis.setex(entity.key, this.timeToLive, value);
              } else {
                await this.redis.set(entity.key, value);
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
      ),
    )
      .then(() => callback(null))
      .catch((err) => callback(err));
  };

  /**
   * delete data from storage
   * @param {IBotStorageContext} context
   * @memberof RedisStorage
   */
  deleteData = async (context) => {
    const commandlist = [];
    if (context.userId) {
      if (context.conversationId) {
        commandlist.push(conversationKey(context));
      } else {
        commandlist.push(userKey(context));
      }
    }

    try {
      await this.redis.del(commandlist);
    } catch (error) {
      //
    }
  };
}
