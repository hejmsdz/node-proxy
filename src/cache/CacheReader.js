const fs = require('fs');
const crypto = require('crypto');
const CacheHelper = require('./CacheHelper');
const Log = require('../Log.js');

const logger = new Log(process.stdout);

/**
 * This class manages the access to cached files.
 */
class CacheReader {
  constructor(url, cacheConfig) {
    this.url = url;
    this.headersFilename = CacheHelper.fullFilename(cacheConfig.folder, url, cacheConfig.headerFileSuffix);
    this.bodyFilename = CacheHelper.fullFilename(cacheConfig.folder, url, cacheConfig.bodyFileSuffix);
    logger.debug(this.headersFilename);
    logger.debug(this.bodyFilename);
  }

  /**
  * The callback function allows to access the cached header object.
  *
  * @callback cacheCallback
  * @param {boolean} errorFlag
  * @param {object} headersObject
  **/

  /**
  * This function reads asynchronously the appropriate headers file.
  * @param {headersCallback} cb - The callback function
  **/
  getHeaders(cb) {
    fs.readFile(this.headersFilename, (err, headers) => {
      if(err) {
        logger.debug('Fehler beim Versuch die Headerdatei zu öffnen.', this.url);
        cb(true, null);
      } else {
        cb(false, JSON.parse(headers));
      }
    });
  }

  /**
   * Returns the
   * @returns {function} readStream of the corresponding file which contains the data.
   **/
  getBodyStream() {
    return fs.createReadStream(this.bodyFilename);
  }

  /**
   * Returns true if the cache server has the file in cache.
   **/
  isCached() {
    if(fs.existsSync(this.headersFilename) && fs.existsSync(this.bodyFilename)) {
      return true;
    } else {
      return false;
    }
  }


  /**
  * The callback function allows to access the header
  * and body of a cached files or to react accordingly
  * if no access is possible.
  *
  * Returns an error if the file is not cached or can not be accessed.
  *
  * @callback cacheCallback
  * @param {boolean} errorFlag
  * @param {object} headersObject
  * @param {readStream} bodyReadStream
  **/

  /**
   * This function tries to access a cached file and executes the callback on completion.
   * @param {cacheCallback} cb - The callback that handles the access.
   **/
  useCache(cb) {
    if(this.isCached()) {
      this.getHeaders((err, headers) => {
        if(err) {
          logger.debug('Cached files do not exist.', this.url);
          cb(true,null,null);
        } else {
          const bodyStream = this.getBodyStream();
          bodyStream.on('error', (err) => {
            logger.debug('Problem with the bodyStream.', this.url);
            cb(true, null, null);
            return;
          });

          cb(false, headers, bodyStream);
        }
      });
    } else {
      logger.debug('useCache: Fehler beim Versuch die Headerdatei zu öffnen.', this.url);
      cb(true, null, null);
      return;
    }
  }
}

module.exports = CacheReader;
