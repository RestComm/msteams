import { connect } from 'amqplib';
import { getLogger } from '../utils';

const { cerror, debug } = getLogger('rabbitmq');

export default class RabbitMqManager {
  setup = async () => {
    try {
      const config = {
        protocol: process.env.RABBITMQ_PROTOCOL,
        hostname: process.env.RABBITMQ_HOST,
        port: process.env.RABBITMQ_PORT,
        username: process.env.RABBITMQ_USERNAME,
        password: process.env.RABBITMQ_PASSWORD,
        locale: process.env.RABBITMQ_LOCALE,
        frameMax: 0,
        heartbeat: 0,
        vhost: '/',
      };
      // debug(process.env.RABBITMQ_URL);
      this.conn = await connect(config);
      this.queuename = process.env.RABBITMQ_QUEUE_NAME;
      debug(`RabbitMq connected. Queue Name: ${this.queuename}`);
      this.channel = await this.conn.createChannel();
      // assertQueue
      await this.channel.assertQueue(this.queuename, {
        durable: true,
      });

      // process.once('SIGINT', async () => {
      //   debug('closing connection');
      //   await this.conn.close();
      // });
      debug('Starting the consumer channel');
      this.receiveFromMq();
    } catch (error) {
      cerror(error.message);
      this.channel = null;
    }
  };

  close = async () => {
    debug('closing connection');
    if (this.conn) {
      try {
        await this.conn.close();
      } catch (error) {
        cerror(error.message);
      }
    }
  };

  /**
   * push a message to the RabbitMq queue
   * @param {String} message The object to save to the queue
   * @memberof RabbitMqManager
   */
  pushToMq = async (message) => {
    if (!this.channel) {
      return; // check for connections
    }
    try {
      // send message
      this.channel.sendToQueue(this.queuename, Buffer.from(message));
      debug('Message push to queue');
    } catch (error) {
      cerror(error.message);
    }
  };

  receiveFromMq = async () => {
    try {
      await this.channel.consume(
        this.queuename,
        (msg) => {
          // Message received.
          const body = msg.content.toString();
          debug(body);
          // perform action on the message
          this.channel.ack(msg);
        },
        { noAck: false },
      );
    } catch (error) {
      cerror(error.message);
    }
  };
}
