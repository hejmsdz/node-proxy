const fs = require('fs');
const crypto = require('crypto');
const CacheHelper = require('./CacheHelper');
const Log = require('../Log.js');


/**
 * A few useful features
 */
class CacheReader {
  constructor(url) {
    this.url = url;
    this.headersFilename = CacheHelper.fullFilename(url, '.headers');
    this.bodyFilename = CacheHelper.fullFilename(url, '.body');
  }

  /**
   * Reads the correct header file.
   * The content can be accessed via a callback function (fn).
   * @param {function} fn callback function
   **/
  getHeaders(fn) {
    fs.readFile(this.headersFilename, (err, headers) => {
      if(err) {
        fn(true, null);
        Log.logToFile('Fehler beim Versuch die Headerdatei zu öffnen.', this.url);
      } else {
        fn(false, JSON.parse(headers));
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
   * Tests if the file is cached.
   * Structure of callback function: fn(err,cachedHeaders, cachedBodyStream)
   * err is true if the file is not cached or there are other problems with loading the content.
   **/
  useCache(fn) {
    if(this.isCached()) {
      this.getHeaders((err, headers) => {
        if(err) {
          fn(true,null,null);
          return;
        } else {
          const bodyStream = this.getBodyStream();
          bodyStream.on('error', (err) => {
            fn(true, null, null);
            return;
          })

          fn(false, headers, bodyStream);
        }
      });
    } else {
      fn(true, null, null);
      return;
    }
  }
}

module.exports = CacheReader;
