import couchdb from 'nano';
import { getLogger } from '../utils';

require('dotenv').config();

const { cerror } = getLogger('db');

const { db } = couchdb({
  url: process.env.COUCHDB_URL,
});

export const databaseSetup = async () => {
  try {
    await db.get(process.env.COUCHDB_DB_NAME);
  } catch (error) {
    cerror(error.message);
    try {
      await db.create(process.env.COUCHDB_DB_NAME);
    } catch (err) {
      cerror(err.message);
    }
  }
};
export const database = db.use(process.env.COUCHDB_DB_NAME);
