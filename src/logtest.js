const fs = require('fs');
const Log = require('./Log.js');

const logWriteStream = fs.createWriteStream('../logs/15-12-2017.log', {flags: 'a'});
const Logger = new Log(process.stdout);

Logger.debug('Debug');
Logger.error('Error');
Logger.info('Info');
Logger.success('Success');
