const fs = require('fs');

/**
 * The class Log allows to create log messages.
 * These can be output on the console or in log files.
 * Facilitates error handling.
 **/
class Log {

  /**
   * This function concatenate appropriately a variable amount
   * of arguments and returns the concatenation.
   * @param {string} a Arguments to concatenate
   * @returns {string} concatenation of arguments
   */
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

  /**
   * This function logs a message to a log file.
   * So that the log files are not too big, a new log file is created every day.
   * @param {string} message Message to log
   * @param {string} [url] Optional message to better identify log messages
   */
  static logToFile(message, url) {
    const today = new Date();
    const dd = today.getDate();
    const mm = today.getMonth()+1;
    const yyyy = today.getFullYear();
    const fileName = `${dd}-${mm}-${yyyy}`;

    const fullFilename = Log.filePrefix + fileName + Log.fileSuffix;

    if(url !== undefined) {
      url = `(${url})`;
    }

    fs.appendFile(fullFilename, Log.createLogMessage(message, url), (err) => {
      if(err) {
        console.error('[Log] Cannot log a message.');
      }
    });
  }

  /**
   * This function logs a message to the console.
   * @param {string} message Message to log
   * @param {string} [url] Optional message to better identify log messages
   */
  static logToConsole(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    console.log(Log.createLogMessage(message, url));
  }
}

/* Some useful variables */
Log.filePrefix = `${__dirname}/../logs/`;
Log.fileSuffix = '.log';
Log.prefix = '[Log]';

module.exports = Log;
