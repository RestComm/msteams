import couchdb from 'nano';
import { getLogger } from '../utils';

require('dotenv').config();

const { cerror, debug } = getLogger('db');

export default class CouchDatabase {
  /**
   * Create an instance of CouchDatabase
   * @param {Object} options constains the url and database name
   */
  constructor(options = {}) {
    const { db } = couchdb({
      url: options.url || process.env.COUCHDB_URL,
    });
    this.db = db;
    const userDatabase = options.dbname || process.env.COUCHDB_DB_NAME;
    db.get(userDatabase, (err, data) => {
      if (err) {
        cerror(err.message);
        // the database does not exist. Create it
        db.create(userDatabase, (error, udata) => {
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
    this.databasename = userDatabase;
  }

  getDb = () => this.db.use(this.databasename);
}
