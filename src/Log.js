const fs = require('fs');

class Log {
  static createLogMessage(/* a1, a2, a3, ... */) {
    let message = Log.prefix;
    for (var i = 0; i < arguments.length; i++) {
      if(arguments[i] !== undefined) {
        message += ` ${arguments[i]}`;
      }
    }
    message += '\n';
    return message;
  }

  static logToFile(message, url) {
    const fullFilename = Log.filePrefix + Log.filename;

    if(url !== undefined) {
      url = `(${url})`;
    }

    fs.appendFile(fullFilename, Log.createLogMessage(message, url), (err) => {
      if(err) {
        console.error('[Log] Cannot log a message.');
      }
    });
  }

  static logToConsole(message) {
    console.log(Log.prefix + message);
  }
}

Log.filePrefix = `${__dirname}/../logs/`;
Log.filename = 'log.txt';
Log.prefix = '[Log]';

module.exports = Log;
