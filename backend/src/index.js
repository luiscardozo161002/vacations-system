const { setInterval } = require('node:timers');
const createServer = require('./server');
const config = require('./config');
const rollover = require('./plugins/vacation-entitlements/rollover');

const DAY_MS = 24 * 60 * 60 * 1000;

class Application {
  async start() {
    const server = await createServer();
    await server.start();
    console.log(`Server listening on ${server.info.uri}`);

    if (config.env !== 'test') this.scheduleRollover();
  }

  scheduleRollover() {
    this.runRollover();
    setInterval(() => this.runRollover(), DAY_MS);
  }

  async runRollover() {
    try {
      const { date, created, expired, cancelled_requests, reminders, skipped } = await rollover.run();
      console.log(
        `Periods ${date}: ${created} opened, ${expired} expired, ${cancelled_requests} requests cancelled, ${reminders} reminders, ${skipped.length} skipped`
      );
    } catch (err) {
      console.error('Could not generate the periods', err);
    }
  }
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

new Application().start();
