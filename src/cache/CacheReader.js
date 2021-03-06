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
        logger.debug('Not possible to open the headers file.', this.url);
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
  * The callback that handles the access if file is found
  *
  * @callback onCacheHit
  * @param {object} cachedHeaders
  * @param {readStream} cachedBodyStream
  **/

  /**
  * The callback that is run otherwise
  *
  * @callback onCacheMiss
  **/

  /**
   * This function tries to access a cached file and executes the callback on completion.
   * @param {Function} onCacheHit
   * @param {Function} onCacheMiss
   **/
  useCache(onCacheHit, onCacheMiss) {
    if(this.isCached()) {
      this.getHeaders((err, headers) => {
        if(err) {
          logger.debug('Cached files do not exist.', this.url);
          onCacheMiss();
        } else {
          const bodyStream = this.getBodyStream();
          bodyStream.on('error', (err) => {
            logger.debug('Problem with the bodyStream.', this.url);
            onCacheMiss();
            return;
          });

          onCacheHit(headers, bodyStream);
        }
      });
    } else {
      logger.debug('useCache: Fehler beim Versuch die Headerdatei zu öffnen.', this.url);
      onCacheMiss();
      return;
    }
  }
}

module.exports = CacheReader;
