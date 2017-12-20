const fs = require('fs');
const chalk = require('chalk');

/**
 * The class Log allows to create log messages.
 **/
class Log {
  constructor(writeableStream) {

    this.debugMode = false;
    if(process.env.DEBUG) {
      this.debugMode= true;
    }

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

  error(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.errorPrefix, message, url));
  }

  info(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.infoPrefix, message, url));
  }

  debug(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    if(this.debugMode) {
      this.writableStream.write(this.createMessage(this.debugPrefix, message, url));
    }
  }

  success(message, url) {
    if(url !== undefined) {
      url = `(${url})`;
    }

    this.writableStream.write(this.createMessage(this.successPrefix, message, url));
  }
}

module.exports = Log;
