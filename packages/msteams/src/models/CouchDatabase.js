import couchdb from 'nano';
import { getLogger } from '../utils';

require('dotenv').config();

const { cerror, debug } = getLogger('db');

export default class CouchDatabase {
  /**
   * Create an instance of CouchDatabase
   * @param {Object} options constains the url and database name
   */
  constructor() {
    const { db } = couchdb({
      url: process.env.COUCHDB_URL,
    });
    this.db = db;
    this.databasename = process.env.COUCHDB_DB_NAME || 'msteamproject';
  }

  init = () => {
    this.db.get(this.databasename, (err, data) => {
      if (err) {
        cerror(err.message);
        // the database does not exist. Create it
        this.db.create(this.databasename, (error, udata) => {
          if (!error) {
            debug('%o', udata);
          } else {
            // print error
            cerror(error.message);
          }
        });
      } else {
        debug('%o', data);
      }
    });
  };

  useDb = () => this.db.use(this.databasename);
}
