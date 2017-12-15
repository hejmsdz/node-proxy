const fs = require('fs');
const chalk = require('chalk');

/**
 * The class Log allows to create log messages.
 * These can be output on the console or in log files.
 * Facilitates error handling.
 **/
class Log {
  constructor(writeableStream) {
    this.writableStream = writeableStream;

    this.infoPrefix = '[Info]';
    this.errorPrefix = (writeableStream == process.stdout) ? chalk.red('[Error]') : '[Error]';
    this.debugPrefix = (writeableStream == process.stdout) ? chalk.blue('[Debug]') : '[Debug]';
    this.successPrefix = (writeableStream == process.stdout) ? chalk.green('[Success]') : '[Success]';
  }

  /**
   * This function concatenate appropriately a variable amount
   * of arguments and returns the concatenation.
   * @param {string} a Arguments to concatenate
   * @returns {string} concatenation of arguments
   */
  createMessage(prefix /* ..., a1, a2, a3, ... */) {
    let message = prefix;
    for (var i = 1; i < arguments.length; i++) {
      if(arguments[i] !== undefined) {
        message += ` ${arguments[i]}`;
      }
    }
    message += '\n';
    return message;
  }

  /**
   * TODO
   */
  error(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.errorPrefix, message, url));
  }

  /**
   * TODO
   */
  info(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.infoPrefix, message, url));
  }

  /**
   * TODO
   */
  debug(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.debugPrefix, message, url));
  }

  /**
   * TODO
   */
  success(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.successPrefix, message, url));
  }
}

/* Some useful variables */
Log.filePrefix = `${__dirname}/../logs/`;
Log.fileSuffix = '.log';

module.exports = Log;
